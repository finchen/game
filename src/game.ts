import 'phaser';
import Peer, { DataConnection } from 'peerjs';

// Data Packet Structure
interface PlayerData {
  id: string; // PeerJS ID of the sender
  name: string;
  x: number;
  y: number;
  // no
  // Potentially animation state, etc. later
}

// Define a simple Player class
class Player extends Phaser.GameObjects.Sprite {
  body!: Phaser.Physics.Arcade.Body;
  playerName: string = '';
  playerNameText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this); // Add the player to the scene

    // Create the player name text, initially empty and invisible
    this.playerNameText = scene.add.text(this.x, this.y - this.height, '', {
      font: '16px Arial',
      color: '#ffffff',
      align: 'center',
    });
    this.playerNameText.setOrigin(0.5, 1); // Center text above player
    this.playerNameText.setVisible(false);
  }

  setName(name: string) {
    this.playerName = name;
    this.playerNameText.setText(name);
    this.playerNameText.setVisible(true);
    // Adjust text position in case player size changed or for fine-tuning
    this.updateNameTextPosition();
  }

  updateNameTextPosition() {
    if (this.playerNameText) {
      this.playerNameText.setPosition(this.x, this.y - this.height / 2 - 5); // 5px buffer
    }
  }

  // Override preUpdate or add a custom update method if more complex logic is needed
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.updateNameTextPosition(); // Keep text position updated
  }
}

class GameScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keysWASD!: { [key: string]: Phaser.Input.Keyboard.Key };
  private playerSpeed: number = 150;
  private playerControlsEnabled: boolean = false;
  private nameInputOverlay!: HTMLElement;

  // Previous player position for sending updates
  private prevPlayerX: number = 0;
  private prevPlayerY: number = 0;
  private positionUpdateThreshold: number = 2; // Min distance change to trigger update

  // Networking properties
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private remotePlayers: Map<string, Player> = new Map(); // For storing remote player sprites

  // UI elements for networking
  private myPeerIdDisplay!: HTMLElement;
  private remotePeerIdInput!: HTMLInputElement;
  private connectButton!: HTMLButtonElement;
  private copyPeerIdButton!: HTMLButtonElement; // Added for the copy button
  private nameInputElements!: HTMLElement; // To group name input parts
  private networkUIElements!: HTMLElement; // To group network UI parts


  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Load assets here
    console.log('GameScene: preload');

    // Load tile assets
    this.load.image('roadTile', 'assets/tiles/isometric_road_01.png');
    this.load.image('buildingTile', 'assets/tiles/isometric_building_01.png');

    // Load character assets
    // Assuming a single frame for now, if it's a spritesheet, this.load.spritesheet() would be used with frame dimensions
    this.load.image('playerSprite', 'assets/character/character_medieval_archer.png');
  }

  create() {
    console.log('GameScene: create');

    this.player = new Player(this, 400, 300, 'playerSprite');
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keysWASD = this.input.keyboard.addKeys('W,A,S,D') as { [key: string]: Phaser.Input.Keyboard.Key };

    // --- UI Handling ---
    this.nameInputOverlay = document.getElementById('nameInputOverlay') as HTMLElement;
    const playerNameInput = document.getElementById('playerNameInput') as HTMLInputElement;
    const submitNameButton = document.getElementById('submitNameButton') as HTMLButtonElement;

    // Networking UI elements
    this.myPeerIdDisplay = document.getElementById('myPeerIdDisplay') as HTMLElement;
    this.remotePeerIdInput = document.getElementById('remotePeerIdInput') as HTMLInputElement;
    this.connectButton = document.getElementById('connectButton') as HTMLButtonElement;
    this.copyPeerIdButton = document.getElementById('copyPeerIdButton') as HTMLButtonElement; // Get the copy button
    
    // For better UI flow, let's assume name input and network UI are separate sections or handled sequentially
    // For now, the name input overlay contains everything. We'll manage visibility.

    if (submitNameButton && playerNameInput && this.nameInputOverlay && this.myPeerIdDisplay && this.remotePeerIdInput && this.connectButton && this.copyPeerIdButton) {
      // Initially, only name input is visible, networking part could be styled display:none or managed here.
      // Assuming for now the whole overlay is visible, and we proceed after name submission.

      submitNameButton.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (name) {
          this.player.setName(name);
          this.playerControlsEnabled = true;
          console.log(`Player name set to: ${name}. Initializing networking...`);
          
          // Hide name input parts, show/enable networking parts if they were separate
          // For simplicity, if all in one overlay, it remains visible for PeerID input.
          // Or, we could hide the overlay and create a new UI for p2p.
          // Current HTML has everything in one overlay.
          // If nameInputOverlay was to be hidden: this.nameInputOverlay.style.display = 'none';
          // But then networking UI needs to be somewhere else or revealed.
          // Let's keep nameInputOverlay and just enable networking.
          
          this.initNetworking(); 
        } else {
          console.log('Player name cannot be empty.');
        }
      });
    } else {
      console.error('Some UI elements for name input or networking are missing!');
      this.playerControlsEnabled = true; // Fallback for playability
    }
  }

  private initNetworking() {
    this.peer = new Peer(); // Uses public PeerJS server by default

    this.peer.on('open', (id) => {
      console.log('My Peer ID is: ' + id);
      if (this.myPeerIdDisplay) {
        this.myPeerIdDisplay.textContent = id;
      }
      // Setup the copy button listener once the ID is available
      if (this.copyPeerIdButton) {
        this.copyPeerIdButton.disabled = false; // Enable the button
        this.copyPeerIdButton.addEventListener('click', () => {
          const peerIdToCopy = this.myPeerIdDisplay.textContent;
          if (peerIdToCopy && peerIdToCopy !== 'Waiting...') {
            navigator.clipboard.writeText(peerIdToCopy)
              .then(() => {
                console.log('Peer ID copied to clipboard:', peerIdToCopy);
                const originalButtonText = this.copyPeerIdButton.textContent;
                this.copyPeerIdButton.textContent = 'Copied!';
                setTimeout(() => {
                  this.copyPeerIdButton.textContent = originalButtonText;
                }, 1500); // Revert after 1.5 seconds
              })
              .catch(clipboardErr => {
                console.error('Failed to copy Peer ID:', clipboardErr);
                // Optional: display an error message to the user
              });
          } else {
            console.log('No Peer ID available to copy.');
          }
        });
      }
    });

    this.peer.on('error', (err) => {
      console.error('PeerJS error:', err);
    });

    this.peer.on('connection', (conn) => {
      console.log(`Incoming connection from ${conn.peer}`);
      this.handleConnection(conn);
    });

    if (this.connectButton && this.remotePeerIdInput) {
      this.connectButton.addEventListener('click', () => {
        const remotePeerId = this.remotePeerIdInput.value.trim();
        if (remotePeerId && this.peer) {
          console.log(`Attempting to connect to ${remotePeerId}`);
          const conn = this.peer.connect(remotePeerId);
          this.handleConnection(conn);
        } else {
          console.log('Remote Peer ID is empty or Peer object not initialized.');
        }
      });
    }
    // Disable copy button initially until ID is available
    if (this.copyPeerIdButton) {
        this.copyPeerIdButton.disabled = true;
    }
  }

  private handleConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);
    console.log(`Handling connection with ${conn.peer}. Total connections: ${this.connections.size}`);

    conn.on('open', () => {
      console.log(`Connection established and open with ${conn.peer}`);
      this.sendPlayerData(conn); // Send local player data to the new peer
    });

    conn.on('data', (data) => {
      // console.log(`Received data from ${conn.peer}:`, data);
      const remotePlayerData = data as PlayerData;

      if (!remotePlayerData || typeof remotePlayerData.id === 'undefined') {
        console.warn('Received malformed player data:', data);
        return;
      }
      
      // Ignore data from self (shouldn't happen with proper server/connection logic)
      if (this.peer && remotePlayerData.id === this.peer.id) {
        return;
      }

      let remotePlayer = this.remotePlayers.get(remotePlayerData.id);

      if (!remotePlayer) {
        // New remote player
        console.log(`Creating new remote player for ${remotePlayerData.id} named ${remotePlayerData.name}`);
        // Create sprite, Player constructor adds to scene
        remotePlayer = new Player(this, remotePlayerData.x, remotePlayerData.y, 'playerSprite');
        remotePlayer.setName(remotePlayerData.name);
        // No physics for remote players for now: this.physics.add.existing(remotePlayer);
        this.remotePlayers.set(remotePlayerData.id, remotePlayer);
      } else {
        // Existing remote player, update position and name
        remotePlayer.setPosition(remotePlayerData.x, remotePlayerData.y);
        if (remotePlayer.playerName !== remotePlayerData.name) {
          remotePlayer.setName(remotePlayerData.name); // Update name if it changed
        }
      }
    });

    conn.on('error', (err) => {
      console.error(`Connection error with ${conn.peer}:`, err);
    });

    conn.on('close', () => {
      console.log(`Connection closed with ${conn.peer}`);
      this.connections.delete(conn.peer);
      this.removeRemotePlayer(conn.peer);
      console.log(`Connection with ${conn.peer} removed. Total connections: ${this.connections.size}`);
    });
  }

  private sendPlayerData(conn?: DataConnection) {
    if (!this.peer || !this.player) return; // Ensure peer and player are initialized

    const localPlayerData: PlayerData = {
      id: this.peer.id,
      name: this.player.playerName,
      x: this.player.x,
      y: this.player.y,
    };

    if (conn) {
      // Send to a specific connection
      if (conn.open) {
        // console.log(`Sending player data to ${conn.peer}:`, localPlayerData);
        conn.send(localPlayerData);
      } else {
        console.warn(`Connection to ${conn.peer} is not open. Cannot send data.`);
      }
    } else {
      // Broadcast to all connections
      // console.log('Broadcasting player data to all connections:', localPlayerData);
      this.connections.forEach((connection) => {
        if (connection.open) {
          connection.send(localPlayerData);
        }
      });
    }
  }
  
  private removeRemotePlayer(peerId: string) {
    const remotePlayer = this.remotePlayers.get(peerId);
    if (remotePlayer) {
      remotePlayer.playerNameText.destroy();
      remotePlayer.destroy(); // Remove sprite from scene
      this.remotePlayers.delete(peerId);
      console.log(`Removed remote player ${peerId}`);
    } else {
      console.log(`Remote player ${peerId} not found for removal.`);
    }
  }

  update() {
    if (!this.playerControlsEnabled || !this.player || !this.player.body) {
      if (this.player && this.player.body) {
        this.player.body.setVelocity(0, 0);
      }
      return;
    }

    // Player movement logic (existing)
    let velocityX = 0;
    let velocityY = 0;

    // Check keyboard inputs for isometric movement
    if (this.cursors.up.isDown || this.keysWASD.W.isDown) {
      velocityY -= this.playerSpeed / 2;
      velocityX -= this.playerSpeed;
    }
    if (this.cursors.down.isDown || this.keysWASD.S.isDown) {
      velocityY += this.playerSpeed / 2;
      velocityX += this.playerSpeed;
    }
    if (this.cursors.left.isDown || this.keysWASD.A.isDown) {
      velocityY += this.playerSpeed / 2;
      velocityX -= this.playerSpeed;
    }
    if (this.cursors.right.isDown || this.keysWASD.D.isDown) {
      velocityY -= this.playerSpeed / 2;
      velocityX += this.playerSpeed;
    }

    const targetVelocity = new Phaser.Math.Vector2(velocityX, velocityY);
    if (targetVelocity.length() > 0) {
        targetVelocity.normalize().scale(this.playerSpeed);
    }
    this.player.body.setVelocity(targetVelocity.x, targetVelocity.y);

    // Network update logic
    if (this.peer && this.connections.size > 0) {
      const dx = this.player.x - this.prevPlayerX;
      const dy = this.player.y - this.prevPlayerY;
      const distanceMoved = Math.sqrt(dx * dx + dy * dy);

      if (distanceMoved > this.positionUpdateThreshold) {
        // console.log('Player moved significantly, broadcasting update.');
        this.sendPlayerData(); // Broadcast to all connections
        this.prevPlayerX = this.player.x;
        this.prevPlayerY = this.player.y;
      }
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: [GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // No gravity for top-down isometric view
      debug: false, // Set to true for physics debugging
    },
  },
};

new Phaser.Game(config);
