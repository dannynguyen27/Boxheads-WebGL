// UCLA's Graphics Example Code (Javascript and C++ translations available), by Garett Ridge for CS174a.
// displayables.js - The subclass definitions here each describe different independent animation processes that you want to fire off each frame, by defining a display
// event and how to react to key and mouse input events.  Make one or two of your own subclasses, and fill them in with all your shape drawing calls and any extra key / mouse controls.

// Now go down to Animation's display() function to see where the sample shapes you see drawn are coded, and a good place to begin filling in your own code.

/********** DECLARE ALL CONSTANTS HERE **********/

// Constants for player ammunition
const MAX_AMMO = 1000;
const START_AMMO = 100;

const ATTACK_TIMER = 1 / 5.4; // Three shots per second

const MAP_TOTAL = 3;
const MAP_SELECTOR = Math.floor(Math.random() * MAP_TOTAL);
/********** CRATE CONSTANTS**********/

const AMMO_PER_CRATE = 10;
const MAX_AMMO_CRATES = 10;
const AMMO_SPAWN_RADIUS = 15;
const CRATE_DESPAWN_TIMER = 15;

const NUM_TYPES_OF_CRATES = 4; // Specifies the different types of crates possible
const AMMO_BOX = 0;
const HEALTH_BOX = 1;
const SPEED_BOX = 2;
const TROLL_BOX = 3;

var enemies_dead = 0;
/********** DECLARE ALL CONSTANTS HERE **********/

Declare_Any_Class( "Debug_Screen",  // Debug_Screen - An example of a displayable object that our class Canvas_Manager can manage.  Displays a text user interface.
  { 'construct': function( context )
      { this.define_data_members( { string_map: context.shared_scratchpad.string_map, info_map: context.shared_scratchpad.info_map,
        start_index: 0, tick: 0, visible: false, graphicsState: new Graphics_State() } );
        shapes_in_use.debug_text = new Text_Line( 35 );
      },
    'init_keys': function( controls )
      { controls.add( "t",    this, function() { this.visible ^= 1;                                                                                                             } );
        controls.add( "up",   this, function() { this.start_index = ( this.start_index + 1 ) % Object.keys( this.string_map ).length;                                           } );
        controls.add( "down", this, function() { this.start_index = ( this.start_index - 1   + Object.keys( this.string_map ).length ) % Object.keys( this.string_map ).length; } );
        this.controls = controls;
      },
    'update_strings': function( debug_screen_object )   // Strings that this displayable object (Debug_Screen) contributes to the UI:
      { debug_screen_object.string_map["tick"]              = "Frame: " + this.tick++;
        debug_screen_object.string_map["text_scroll_index"] = "Text scroll index: " + this.start_index;
      },
    'display': function( time )
      { 
        shaders_in_use["Default"].activate();
        gl.uniform4fv( g_addrs.shapeColor_loc, Color( 1, 1, 1, 1 ) );

        var font_scale = scale( .02, .04, 1 ),
            strings = Object.keys( this.string_map );
            info = Object.keys( this.info_map );

        model_transform = mult( translation(-.95, .9, 0), font_scale );
        shapes_in_use.debug_text.set_string( this.info_map["ammo"] );
        shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );  // Draw some UI text (strings)

        model_transform = mult( translation(-.25, .9, 0), font_scale );
        shapes_in_use.debug_text.set_string( this.info_map["score"] );
        shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );

        model_transform = mult( translation(-.3, -.7, 0), font_scale );
        shapes_in_use.debug_text.set_string( this.info_map["event"] );
        shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );

        model_transform = mult( translation( -.95, -.9, 0 ), font_scale );

        if( !this.visible ) return;        

        for( var i = 0, idx = this.start_index; i < 4 && i < strings.length; i++, idx = (idx + 1) % strings.length )
        {
          shapes_in_use.debug_text.set_string( this.string_map[ strings[idx] ] );
          shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );  // Draw some UI text (strings)
          model_transform = mult( translation( 0, .08, 0 ), model_transform );
        }
        model_transform = mult( translation( .7, .9, 0 ), font_scale );
        shapes_in_use.debug_text.set_string( "Controls:" );
        shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );    // Draw some UI text (controls title)

        for( let k of Object.keys( this.controls.all_shortcuts ) )
        {
          model_transform = mult( translation( 0, -0.08, 0 ), model_transform );
          shapes_in_use.debug_text.set_string( k );
          shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );  // Draw some UI text (controls)
        }
      }
  }, Animation );

Declare_Any_Class( "Camera",     // An example of a displayable object that our class Canvas_Manager can manage.  Adds both first-person and
  { 'construct': function( context )     // third-person style camera matrix controls to the canvas.
      { // 1st parameter below is our starting camera matrix.  2nd is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
        context.shared_scratchpad.graphics_state = new Graphics_State( mult(translation(0, 0,-12), rotation(-50,1,0,0)), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );
        this.define_data_members( { graphics_state: context.shared_scratchpad.graphics_state, thrust: vec3(), origin: vec3( 0, 5, 0 ), looking: false } );

        // *** Mouse controls: ***
        this.mouse = { "from_center": vec2() };
        var mouse_position = function( e ) { return vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2 ); };   // Measure mouse steering, for rotating the flyaround camera.
        canvas.addEventListener( "mouseup",   ( function(self) { return function(e) { e = e || window.event;    self.mouse.anchor = undefined;              } } ) (this), false );
        canvas.addEventListener( "mousedown", ( function(self) { return function(e) { e = e || window.event;    self.mouse.anchor = mouse_position(e);      } } ) (this), false );
        canvas.addEventListener( "mousemove", ( function(self) { return function(e) { e = e || window.event;    self.mouse.from_center = mouse_position(e); } } ) (this), false );
        canvas.addEventListener( "mouseout",  ( function(self) { return function(e) { self.mouse.from_center = vec2(); }; } ) (this), false );    // Stop steering if the mouse leaves the canvas.
      },
    'init_keys': function( controls )   // init_keys():  Define any extra keyboard shortcuts here
      {/* controls.add( "Space", this, function() { this.thrust[1] = -1; } );     controls.add( "Space", this, function() { this.thrust[1] =  0; }, {'type':'keyup'} );
        controls.add( "z",     this, function() { this.thrust[1] =  1; } );     controls.add( "z",     this, function() { this.thrust[1] =  0; }, {'type':'keyup'} );
        controls.add( "w",     this, function() { this.thrust[2] =  1; } );     controls.add( "w",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'} );
        controls.add( "a",     this, function() { this.thrust[0] =  1; } );     controls.add( "a",     this, function() { this.thrust[0] =  0; }, {'type':'keyup'} );
        controls.add( "s",     this, function() { this.thrust[2] = -1; } );     controls.add( "s",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'} );
        controls.add( "d",     this, function() { this.thrust[0] = -1; } );     controls.add( "d",     this, function() { this.thrust[0] =  0; }, {'type':'keyup'} );
        controls.add( "f",     this, function() { this.looking  ^=  1; } );
        controls.add( ",",     this, function() { this.graphics_state.camera_transform = mult( rotation( 6, 0, 0,  1 ), this.graphics_state.camera_transform ); } );
        controls.add( ".",     this, function() { this.graphics_state.camera_transform = mult( rotation( 6, 0, 0, -1 ), this.graphics_state.camera_transform ); } );
        controls.add( "o",     this, function() { this.origin = mult_vec( inverse( this.graphics_state.camera_transform ), vec4(0,0,0,1) ).slice(0,3)         ; } );
        controls.add( "r",     this, function() { this.graphics_state.camera_transform = mat4()                                                               ; } );
       */

      },
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
      { var C_inv = inverse( this.graphics_state.camera_transform ), pos = mult_vec( C_inv, vec4( 0, 0, 0, 1 ) ),
                                                                  z_axis = mult_vec( C_inv, vec4( 0, 0, 1, 0 ) );                                                                 
        user_interface_string_manager.string_map["origin" ] = "Center of rotation: " + this.origin[0].toFixed(0) + ", " + this.origin[1].toFixed(0) + ", " + this.origin[2].toFixed(0);                                                       
        user_interface_string_manager.string_map["cam_pos"] = "Cam Position: " + pos[0].toFixed(2) + ", " + pos[1].toFixed(2) + ", " + pos[2].toFixed(2);    // The below is affected by left hand rule:
        user_interface_string_manager.string_map["facing" ] = "Facing: "       + ( ( z_axis[0] > 0 ? "West " : "East ") + ( z_axis[1] > 0 ? "Down " : "Up " ) + ( z_axis[2] > 0 ? "North" : "South" ) );
      },
    'display': function( time )
      { /* var leeway = 70,  degrees_per_frame = .0004 * this.graphics_state.animation_delta_time,
                          meters_per_frame  =   .01 * this.graphics_state.animation_delta_time;
        // Third-person camera mode: Is a mouse drag occurring?
        if( this.mouse.anchor )
        {
          var dragging_vector = subtract( this.mouse.from_center, this.mouse.anchor );            // Arcball camera: Spin the scene around the world origin on a user-determined axis.
          if( length( dragging_vector ) > 0 )
            this.graphics_state.camera_transform = mult( this.graphics_state.camera_transform,    // Post-multiply so we rotate the scene instead of the camera.
                mult( translation( this.origin ),
                mult( rotation( .05 * length( dragging_vector ), dragging_vector[1], dragging_vector[0], 0 ),
                      translation(scale_vec( -1, this.origin ) ) ) ) );
        }
        // First-person flyaround mode:  Determine camera rotation movement when the mouse is past a minimum distance (leeway) from the canvas's center.
        var offset_plus  = [ this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway ];
        var offset_minus = [ this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway ];

        for( var i = 0; this.looking && i < 2; i++ )      // Steer according to "mouse_from_center" vector, but don't start increasing until outside a leeway window from the center.
        {
          var velocity = ( ( offset_minus[i] > 0 && offset_minus[i] ) || ( offset_plus[i] < 0 && offset_plus[i] ) ) * degrees_per_frame;  // Use movement's quantity unless the &&'s zero it out
          this.graphics_state.camera_transform = mult( rotation( velocity, i, 1-i, 0 ), this.graphics_state.camera_transform );     // On X step, rotate around Y axis, and vice versa.
        }     // Now apply translation movement of the camera, in the newest local coordinate frame
        this.graphics_state.camera_transform = mult( translation( scale_vec( meters_per_frame, this.thrust ) ), this.graphics_state.camera_transform );*/
      }
  }, Animation );

Declare_Any_Class( "World",  // An example of a displayable object that our class Canvas_Manager can manage.  This one draws the scene's 3D shapes.
  { 'construct': function( context )
      { this.shared_scratchpad    = context.shared_scratchpad;
      	this.shared_scratchpad.animate = 1;
      	
      	this.level = 1;
      	this.player = new Player(this);
      	this.enemies = []; this.enemySpawnTimer = 0; this.maxEnemies = 30;
      	this.projectiles = [];
        this.ammoCrate = []; this.crateSpawnTimer = 0; this.maxCrates = MAX_AMMO_CRATES;
      	this.mapObjects = [];
      	//set up the (static!) world objects
      	shapes_in_use.groundPlane = new Floor();
      	//setup boundary
      	this.xMin=-16; this.xMax=16;
      	this.yMin=-16; this.yMax=16;

        this.gameStart = false;     
        // Mute Option 
        this.mute = false;
        // Pause Option
        this.pause = false;

        // Keeps track of player's score
        this.score = 0;

        // Keeps track of enemies slain
        this.enemiesKilled = 0;
        this.enemiesNeededToLevelUp = 10;

        this.event_timer = 3.0;
        this.event = "Level " + this.level + " : Start!";

       	// the following part of the map layout is added depending on the specified mapNum
       	if(MAP_SELECTOR == 0)
       	{
          this.wallsArray =            // castle layout
              [ [-10,12],[-9,12],[-8,12],[-7,12],[-6,12],[-5,12],[-4,12],[-3,12],[-2,12],       // start inner rim
                [-10,11],[-10,10],[-10,9],[-10,8],[-10,7],[-10,6],[-10,5],[-10,4],[-10,3],[-10,2],
                [10,12],[9,12],[8,12],[7,12],[6,12],[5,12],[4,12],[3,12],[2,12],
                [10,11],[10,10],[10,9],[10,8],[10,7],[10,6],[10,5],[10,4],[10,3],[10,2],
                [-10,-11],[-10,-10],[-10,-9],[-10,-8],[-10,-7],[-10,-6],[-10,-5],[-10,-4],[-10,-3],[-10,-2],
                [-10,-12],[-9,-12],[-8,-12],[-7,-12],[-6,-12],[-5,-12],[-4,-12],[-3,-12],[-2,-12],
                [10,-12],[9,-12],[8,-12],[7,-12],[6,-12],[5,-12],[4,-12],[3,-12],[2,-12],
                [10,-11],[10,-10],[10,-9],[10,-8],[10,-7],[10,-6],[10,-5],[10,-4],[10,-3],[10,-2],    // end inner rim    
  	      
                [-4,8],[-4,7],[-4,6],[-5,6],[-6,6],
                [-4,-8],[-4,-7],[-4,-6],[-5,-6],[-6,-6],
                [4,8],[4,7],[4,6],[5,6],[6,6],
                [4,-8],[4,-7],[4,-6],[5,-6],[6,-6],
                
                [-5,3],[-5,2],[-5,1],[-5,0],[-5,-1],[-5,-2],[-5,-3],
                [5,3],[5,2],[5,1],[5,0],[5,-1],[5,-2],[5,-3],       
  	      
                [-2,3],[-1,3],[2,3],
                [-2,2],[-2,1],[-2,0],[-2,-1],[-2,-2],[2,2],[2,1],[2,0],[2,-1],[2,-2],
                [-2,-3],[-1,-3],[0,-3],[1,-3],[2,-3]
                
          ];    
       	}
       	else if(MAP_SELECTOR == 1)// mapNum would be some non-zero here
       	{
          this.wallsArray =
       		[ [9,6],[9,7],[9,8],[9,9],[9,10],[9,11],[9,12],[9,13],[9,14], // Right hook long vertical
       		  [8,6],[7,6],[6,6],[5,6],[5,6],[4,6],[3,6],                  // Right hook medium horizontal
       		  [3,7],[3,8],[3,9],[3,10],                                   // Right hook short vertical
       		  [4,10],[5,10],                                              // Right hook short horizontal
       		  
       		  [-9,6],[-9,7],[-9,8],[-9,9],[-9,10],[-9,11],[-9,12],[-9,13],[-9,14], // Left hook long vertical
       		  [-8,6],[-7,6],[-6,6],[-5,6],[-5,6],[-4,6],[-3,6],                    // Left hook medium horizontal
       		  [-3,7],[-3,8],[-3,9],[-3,10],                                        // Left hook short vertical
       		  [-4,10],[-5,10],                                                     // Left hook short horizontal
       		  
       		  [12,-2],[11,-2],[10,-2],[9,-2],[8,-2],[7,-2],[6,-2],[5,-2],          // Right question mark long horizontal
       		  [5,-3],[5,-4],[5,-5],[5,-6],[5,-7],                                  // Right question mark medium vertical
       		  [6,-7],[7,-7],[8,-7],[9,-7],                                         // Right question mark short horizontal
       		  [9,-8],[9,-9],[9,-10],[9,-11],                                       // Right question mark long vertical
       		  
       		  [-12,-2],[-11,-2],[-10,-2],[-9,-2],[-8,-2],[-7,-2],[-6,-2],[-5,-2],  // Left question mark long horizontal
       		  [-5,-3],[-5,-4],[-5,-5],[-5,-6],[-5,-7],                             // Left question mark medium vertical
       		  [-6,-7],[-7,-7],[-8,-7],[-9,-7],                                     // Left question mark short horizontal
       		  [-9,-8],[-9,-9],[-9,-10],[-9,-11],                                   // Left question mark long vertical
       		  
       		  [-12, 12],[-12,11],[-12,8],[-12,7],[-12,4],[-12,3],                  // Top left dashes
       		  [12, 12],[12,11],[12,8],[12,7],[12,4],[12,3],                        // Top right dashes
       		  
       		  [-14,-3],[-14,-4],[-14,-7],[-14,-8],[-14,-11],[-14,-12],             // Bottom left dashes
       		  [14,-3],[14,-4],[14,-7],[14,-8],[14,-11],[14,-12],             // Bottom right dashes
       		  
       		  [-1,-7],[-1,-12],[0,-7],[0,-12],[1,-7],[1,-12],
       		  
       		  [-6,1],[-5,1],[-4,1],[4,1],[5,1],[6,1]
       		];
        }
         else if(MAP_SELECTOR == 2)
         {
             this.wallsArray = 
               [ 
                 [-13,11],[-12,11],[-11,11],[-10,11],[-9,11],[-8,11],[-7,11],[-6,11], // Top Left L
                 [-6,10],[-6,9],[-6,8],[-6,7],[-6,6],[-6,5],[-6,4],       

                 [-1,8],[0,8],[1,8], // Middle dash       

                 [13,11],[12,11],[11,11],[10,11],[9,11],[8,11],[7,11],[6,11], // Top Right L
                 [6,10],[6,9],[6,8],[6,7],[6,6],[6,5],[6,4],      

                 [-7,-1],[-6,-1],[-5,-1],[-4,-1],
                 [-8,-1],[-8,-2],[-8,-3],[-8,-4],[-8,-5],[-8,-6],[-8,-7],[-8,-8],[-8,-9],[-8,-10],[-8,-11],[-8,-12], // Left Brace
                 [-7,-12],[-6,-12],[-5,-12],[-4,-12],       

                 [7,-1],[6,-1],[5,-1],[4,-1],
                 [8,-1],[8,-2],[8,-3],[8,-4],[8,-5],[8,-6],[8,-7],[8,-8],[8,-9],[8,-10],[8,-11],[8,-12], // Right Brace
                 [7,-12],[6,-12],[5,-12],[4,-12],       

                 [11,-13],[11,-12],[11,-11], // Botom Right L
                 [12,-11],[13,-11],[14,-11],      

                 [-11,-13],[-11,-12],[-11,-11], // Bottom Left L
                 [-12,-11],[-13,-11],[-14,-11],       

                 [-11,4],[-12,3],[-13,2],[-14,1], // Left zig-zag
                 [-13,0],[-12,-1],[-11,-2],
                 [-11,-2],[-12,-3],[-13,-4],[-14,-5],       

                 [11,4],[12,3],[13,2],[14,1], // Right zig-zag
                 [13,0],[12,-1],[11,-2],
                 [11,-2],[12,-3],[13,-4],[14,-5]
               ];
         }
       	
       	this.wallBoolean = [];
       	for(var i=this.xMin;i<=this.xMax;i++){
       	    for(var j= this.yMin; j<=this.yMax;j++){
       		this.wallBoolean.push(false);
       	    }
       	}
       	for(var i=0;i<this.wallsArray.length;i++){
       	    this.wallBoolean[this.wallsArray[i][0]*(this.yMax-this.yMin)+this.wallsArray[i][1]] = true;
       	}
      	//TODO: set up geometry shared by all actors
      	shapes_in_use.cube = new Cube();
      	shapes_in_use.sphere = new Subdivision_Sphere(3);
        shapes_in_use.oriented_cube = new Oriented_Cube();      
        shapes_in_use.square = new Square();
        shapes_in_use.flat_square           = Square.prototype.auto_flat_shaded_version();
        shapes_in_use.event_text = new Text_Line( 35 );

        // *** Mouse controls: ***
        this.mouse = { "from_center": vec2() };
        var mouse_position = function( e ) { return vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2 ); };   // Measure mouse steering, for rotating the flyaround camera.
        canvas.addEventListener( "mouseup",   ( function(self) { return function(e) { e = e || window.event;    self.mouse.anchor = undefined;              } } ) (this), false );
        canvas.addEventListener( "mousedown", ( function(self) { return function(e) { e = e || window.event;    self.mouse.anchor = mouse_position(e);      } } ) (this), false );
        canvas.addEventListener( "mousemove", ( function(self) { return function(e) { e = e || window.event;    self.mouse.from_center = mouse_position(e); } } ) (this), false );
        canvas.addEventListener( "mouseout",  ( function(self) { return function(e) { self.mouse.from_center = vec2(); }; } ) (this), false );    // Stop steering if the mouse leaves the canvas.
             
      },
    'levelUp': function()
    {
      this.level++;
      this.enemiesKilled = 0;
      this.enemiesNeededToLevelUp = Math.min(25, this.enemiesNeededToLevelUp + 5);
    },
    'init_keys': function( controls )   // init_keys():  Define any extra keyboard shortcuts here
      {
        	this.keyBitMap = {}; //deals with the problem of simultaneous keypresses
          controls.add( "up", this, function() { this.keyBitMap["up"]=true; this.player.moveForward(true); } ); 
        	controls.add( "up",this, function() {  this.keyBitMap["up"]=false; this.player.moveForward(false); if(this.keyBitMap["down"]) this.player.moveBackward(true); }, {'type':'keyup'} );
                  
        	controls.add( "left", this, function() { this.keyBitMap["left"]=true; this.player.moveLeft(true); } ); 
        	controls.add( "left",this, function() {this.keyBitMap["left"]=false; this.player.moveLeft(false); if(this.keyBitMap["right"]) this.player.moveRight(true); }, {'type':'keyup'} );
                 
        	controls.add( "down", this, function() { this.keyBitMap["down"]=true; this.player.moveBackward(true); } ); 
        	controls.add( "down",this, function() { this.keyBitMap["down"]=false; this.player.moveBackward(false); if(this.keyBitMap["up"]) this.player.moveForward(true); }, {'type':'keyup'} );
                  
        	controls.add( "right", this, function() { this.keyBitMap["right"]=true; this.player.moveRight(true); } ); 
        	controls.add( "right",this, function() {this.keyBitMap["right"]=false; this.player.moveRight(false); if(this.keyBitMap["left"]) this.player.moveLeft(true); }, {'type':'keyup'} );
          controls.add( "m", this, function() { this.mute = !this.mute;}); 
          controls.add( "p", this, function() { this.pause = !this.pause;});        
        
      	  controls.add( "space", this, function() {this.player.attack()} ); 
      },
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
      {
        this.player.update_strings( user_interface_string_manager );
        user_interface_string_manager.string_map["time"]    = "Animation Time: " + Math.round( this.shared_scratchpad.graphics_state.animation_time )/1000 + "s";
        user_interface_string_manager.string_map["animate"] = "Animation " + (this.shared_scratchpad.animate ? "on" : "off") ;
      },
    'checkPlayerCollision': function(newPosition, tolerance){
	var vec = subtract(this.player.position,newPosition);
	     return dot(vec,vec) < tolerance*tolerance;
    },
    'checkEnemyCollision': function(self,newPosition,tolerance){
	      for(var i=0;i<this.enemies.length;i++){
		  var vec = subtract(this.enemies[i].position,newPosition);
	       if(this.enemies[i] != self && this.enemies[i].dying == false &&
	           dot(vec,vec) < tolerance*tolerance){
		         return i;
	           }
	       }
        return -1;
    },
    // returns true if it collides with wall, false otherwise
    'collidesWithWall': function(newPosition,tolerance){
	var intPositions = [vec4(Math.floor(newPosition[0]+0.5),Math.floor(newPosition[1]+0.5),0,1),
			    vec4(Math.floor(newPosition[0]+0.5)+1,Math.floor(newPosition[1]+0.5),0,1),
			    vec4(Math.floor(newPosition[0]+0.5)-1,Math.floor(newPosition[1]+0.5),0,1),
			    vec4(Math.floor(newPosition[0]+0.5),Math.floor(newPosition[1]+0.5)+1,0,1),
			    vec4(Math.floor(newPosition[0]+0.5),Math.floor(newPosition[1]+0.5)-1,0,1),
			    /*vec4(Math.floor(newPosition[0]+0.5)+1,Math.floor(newPosition[1]+0.5)+1,0,1),
			    vec4(Math.floor(newPosition[0]+0.5)-1,Math.floor(newPosition[1]+0.5)-1,0,1),
			    vec4(Math.floor(newPosition[0]+0.5)-1,Math.floor(newPosition[1]+0.5)+1,0,1),
			    vec4(Math.floor(newPosition[0]+0.5)+1,Math.floor(newPosition[1]+0.5)-1,0,1),*/
			   ]
	for(var i=0;i<intPositions.length;i++){
	    if(this.wallBoolean[intPositions[i][0]*(this.yMax-this.yMin)+intPositions[i][1]]){
		var vec = subtract(vec4(newPosition[0], newPosition[1],0,1),intPositions[i]);
		if(dot(vec,vec) < tolerance*tolerance)
		    return true;
	    }
	}
        return false;
    },
    'canSpawnCrates': function(self, newPosition, tolerance){
      for (var i = 0; i < this.ammoCrate.length; i++){
        if (this.ammoCrate[i] == self)
          continue;
        if (length(subtract(this.ammoCrate[i].position, newPosition)) < tolerance)
        {
          return false;
        }
      }
      return true;
    },

    'checkBounds': function(newPosition){
	return newPosition[0]>=this.xMin && newPosition[0]<=this.xMax &&
	     newPosition[1]>=this.yMin && newPosition[1]<=this.yMax
    },
    'drawWalls': function(){

      wall = new Material( Color( 0,0,0,1 ), 0.3, 0.5, 0, 10, "Visuals/simple_outline.jpg")//,"Visuals/wall_bumpmap.jpg");
      for(var i = 0; i < this.wallsArray.length; i++){
        model_transform = mat4();
        model_transform = mult(model_transform, translation(this.wallsArray[i][0], this.wallsArray[i][1], 0));
        model_transform = mult(model_transform, scale(1, 1, 5));
        shapes_in_use.cube.draw(this.shared_scratchpad.graphics_state, model_transform, wall);
      }
    },
    'animateGame': function(time, mapNum){   
      var graphics_state  = this.shared_scratchpad.graphics_state,
          model_transform = mat4(); 

      // *** Materials: 
      // 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
      var ground = new Material( Color( 0,0,0,1 ), .4, 10, 0, 10, "Visuals/ground_texture.jpg","Visuals/wall_bumpmap.jpg" ), // Omit the final (string) parameter if you want no texture
          wall = new Material( Color( 0,0,0,1 ), 0.3, 0.7, 0, 10, "Visuals/simple_outline.jpg");
          portal = new Material( Color( 0.3,0.3,0.3,1 ), 0.5, 0.4, 0, 10, "Visuals/portal.jpg");
          placeHolder = new Material( Color(0,0,0,0), 0,0,0,0, "Blank" );

      // Map Indexing
      /*

           -15 <--0--> +15
        -----------------------
        |                     | 15
        |                     | +
        |                     | ^
        |                     | |
        |                     | 0
        |                     | |
        |                     | v
        |                     | -15
        -----------------------
      */

      for(var i = this.xMin-1; i < this.xMax+2; i++){
        if(i > -2 && i < 2)           //  opening for enemies to walk through
          continue;
        model_transform = mat4();
        model_transform = mult(model_transform, translation(this.xMin-1, i, 0));      // initialize walls for left side
        model_transform = mult(model_transform, scale(0.8, 1, 5));
        shapes_in_use.cube.draw(graphics_state, model_transform, wall);
      }
      for(var i = this.yMin; i < this.yMax+2; i++){                                          // front side
        if(i > -2 && i < 2)
          continue;
        model_transform = mat4();
        model_transform = mult(model_transform, translation(i, this.yMin-1, 0));
        model_transform = mult(model_transform, scale(1, 0.8, 5));
        shapes_in_use.cube.draw(graphics_state, model_transform, wall);
      }
      for(var i = this.xMin; i < this.xMax+1; i++){                                          // right side
        if(i > -2 && i < 2)
          continue;
        model_transform = mat4();
        model_transform = mult(model_transform, translation(this.xMax+1, i, 0));
        model_transform = mult(model_transform, scale(0.8, 1, 5));
        shapes_in_use.cube.draw(graphics_state, model_transform, wall);
      }
      for(var i = this.yMin; i < this.yMax+2; i++){                                          // back side
        if(i > -2 && i < 2)
          continue;
        model_transform = mat4();
        model_transform = mult(model_transform, translation(i, this.yMax+1, 0));
        model_transform = mult(model_transform, scale(1, 0.8, 5));
        shapes_in_use.cube.draw(graphics_state, model_transform, wall);
      }

      this.drawWalls();    

        model_transform = mat4();
        model_transform = mult(model_transform, translation(0, 17, 1.5));
        model_transform = mult(model_transform, scale(2, 1, 2));
        shapes_in_use.cube.draw(graphics_state, model_transform, portal);

      if (this.pause)
        return;
      
      //TODO: spawn new actors
      if(this.enemySpawnTimer < 0 && this.enemies.length < this.maxEnemies){
          // This currently spawns enemies in the corners of the map
          var XCoord, YCoord;
          var timeOut = 0;
      do 
          {
            var random = Math.floor(Math.random() * 4);
              switch (random) {
              case 0:
                XCoord = 0; YCoord = 16; break;
              case 1:
                XCoord = -16; YCoord = 0; break;
              case 2:
                XCoord = 16; YCoord = 0; break;
              case 3:
                XCoord = 0; YCoord = -16; break;
            }
          } while (timeOut++ < 5 && (this.checkPlayerCollision(vec4(XCoord,YCoord,0,1),3) || this.checkEnemyCollision(null,vec4(XCoord,YCoord,0,1),3) != -1));
          /*
          do{
          randomX = Math.random()*(this.xMax-this.xMin)+this.xMin;
          randomY = Math.random()*(this.yMax-this.yMin)+this.yMin;    
          
          }
          while(this.checkPlayerCollision(vec4(randomX,randomY,0,1),3) || 
          this.checkEnemyCollision(null,vec4(randomX,randomY,0,1),3)!= -1); */
           // TODO: UPDATE THIS WITH FORMULA TO GENERATE NORMAL/DEVIL
          var random = Math.floor(Math.random() * 10);
          if (random < 2)
            this.enemies.push(new Devil_Enemy(this, translation(XCoord, YCoord, 0)));
          else 
            this.enemies.push(new Normal_Enemy(this, translation(XCoord, YCoord, 0)));
          //this.enemies.push(new Enemy(this, translation(XCoord,YCoord,0)));
          //var audio = new Audio('init_dog.mp3');
          //audio.play();
          this.enemySpawnTimer = 4.0;//TODO: update this with a formula later
      }
      else{
          this.enemySpawnTimer -= graphics_state.animation_delta_time/1000;
      }   

      // Spawn Ammo Crates
      if(this.crateSpawnTimer < 0 && this.ammoCrate.length < this.maxCrates){
          // Spawn at random locations, make sure that crates do not bunch together
          var randomX;
          var randomY;
          var timeOut = 0;
          do{
            timeOut++;
            randomX = Math.random()*(this.xMax-this.xMin)+this.xMin;
            randomY = Math.random()*(this.yMax-this.yMin)+this.yMin;
          } while (timeOut < 5 && (this.checkPlayerCollision(vec4(randomX,randomY,0,1),3) ||
              this.collidesWithWall(vec4(randomX,randomY,0,1),3) ||
               (!this.canSpawnCrates(null, vec4(randomX, randomY, 0, 1), AMMO_SPAWN_RADIUS))) );    

          // Makes sure that browser doesn't say
          if (timeOut < 5)
          {
            var randomType = Math.floor(Math.random() * NUM_TYPES_OF_CRATES);
            this.ammoCrate.push(new AmmoCrate(this, randomType, translation(randomX,randomY,0)));
            this.crateSpawnTimer = 2.0; //TODO: update this with a formula later
          }
      }
      else{
          this.crateSpawnTimer -= graphics_state.animation_delta_time/1000;
      }   

      //draw the ground
      shapes_in_use.groundPlane.draw(graphics_state, scale(100,100,100), ground);    

      //let player + each actor do their thing
      this.player.display(graphics_state.animation_delta_time);
      for (var i=0;i<this.enemies.length;i++){
          if(this.enemies[i].alive){
          this.enemies[i].display(graphics_state.animation_delta_time);
          }
          else{
            this.enemies.splice(i,1);
            this.enemiesKilled++;
          }
      }
      for (var i=0;i<this.projectiles.length;i++){
          if(this.projectiles[i].alive){
          this.projectiles[i].display(graphics_state.animation_delta_time);
          }
          else this.projectiles.splice(i,1);
      }
      for (var i = 0; i < this.ammoCrate.length; i++){
        if(this.ammoCrate[i].alive){
          this.ammoCrate[i].display(graphics_state.animation_delta_time);
        }
        else this.ammoCrate.splice(i,1);
      }
    },
    'renderScreen': function(title)
      {
        var title = new Material( Color( 0,0,0,1 ), 0.8, .4, 0, 0, title );
        var saved_camera  = this.shared_scratchpad.graphics_state.camera_transform;
        this.shared_scratchpad.graphics_state.camera_transform = translation(0, 0, -2.5);
        model_transform = mat4();
        model_transform = mult(model_transform, rotation(180, 0, 1, 0));  // rotate
        model_transform = mult(model_transform, scale(1.875, 1.055, 1));  // fix aspect ratio
        shapes_in_use.flat_square.draw(this.shared_scratchpad.graphics_state, model_transform, title); 
        this.shared_scratchpad.graphics_state.camera_transform = saved_camera;
    },
    'resetGame': function()
    {
        this.score = 0;
        this.shared_scratchpad.graphics_state = new Graphics_State( mult(translation(0, 0,-12), rotation(-50,1,0,0)), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );
        this.shared_scratchpad.animate = 1;
        this.enemiesKilled = 0;
        this.enemiesNeededToLevelUp = 10;
        this.level = 1;
        this.player = new Player(this);
        this.enemies = []; this.enemySpawnTimer = 0; this.maxEnemies = 30;
        this.projectiles = [];
        this.ammoCrate = []; this.crateSpawnTimer = 0; this.maxCrates = MAX_AMMO_CRATES;
        this.mapObjects = [];
    },
    'display': function(time)
      {
        var graphics_state  = this.shared_scratchpad.graphics_state,
            model_transform = mat4();             // We have to reset model_transform every frame, so that as each begins, our basis starts as the identity.
        shaders_in_use[ "Default" ].activate();

        // *** Lights: *** Values of vector or point lights over time.  Arguments to construct a Light(): position or vector (homogeneous coordinates), color, size
        // If you want more than two lights, you're going to need to increase a number in the vertex shader file (index.html).  For some reason this won't work in Firefox.
        graphics_state.lights = [];                    // First clear the light list each frame so we can replace & update lights.

	      //One light to illuminate them all
        graphics_state.lights.push( new Light( vec4(  0,  0,  10, 1 ), Color(1, 1, 1, 1 ), 1000 ) );

        //change game level
        if(this.enemiesKilled >= this.enemiesNeededToLevelUp)
        {
          this.levelUp();
        }

        /**********************************
        Start coding down here!!!!
        **********************************/
        // initialize start screen
        if(!this.gameStart){
            this.renderScreen("screens/title.jpg");    
            if(this.mouse.anchor){
              if(this.mouse.from_center[0] > -310 && this.mouse.from_center[0] < 320 && this.mouse.from_center[1] > -50 && this.mouse.from_center[1] < 70)
                this.gameStart = true;
            }
        }                
        else if(this.player.alive){
          this.animateGame(time, MAP_SELECTOR);
        }
        else{
            this.renderScreen("screens/end.jpg");
            if(this.mouse.anchor){
              if(this.mouse.from_center[0] > -340 && this.mouse.from_center[0] < 340 && this.mouse.from_center[1] > 0 && this.mouse.from_center[1] < 120){
                this.gameStart = false;
                this.resetGame();
              }
            }
        }
        
      }
  }, Animation );

Declare_Any_Class( "Player", 
  { 'construct': function( worldHandle, modelTransMat=mat4(), initHealth=20)
    {     
      this.define_data_members(
        { world: worldHandle, model_transform: modelTransMat, position: mult_vec(modelTransMat,vec4(0,0,0,1)), 
          heading:vec4(0,1,0,0), velocity: vec4(0,0,0,0),
				  bool_reverseAnimate:false, limbAngle:0,moveSpeed: 4, defaultSpeed: 4, dying: false, alive: true, 
          health:initHealth, maxHealth:initHealth, autoAttackTimer:0.0, ammo: START_AMMO, materials:{},
          lowHPThres: 0.4, midHPThres: 0.6, buff_timer: 0.0, deltaTime: 0, fallAngle: 0, fadeTimer: 1, fadeRate: 0, 
        });
    this.materials.head = new Material(Color(0,0,0,1),1,.4,0,10, "Visuals/player_head.jpg");
    this.materials.body = new Material(Color(0,0,0,1),0.8,.4,0,10, "Visuals/player_body.jpg");
    this.materials.fullBar = new Material(Color(0,0.7,0,1),1,0,0,10);
    this.materials.midBar = new Material(Color(1,0.6,0,1),1,0,0,10);
    this.materials.lowBar = new Material(Color(0.6,0,0,1),1,0,0,10);
    this.materials.default = new Material(Color(0.6,0.32,0.138,1),0.8,0,0,20);

    },
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
      {
  	  //TODO: may want to update UI with player info later on
        user_interface_string_manager.info_map["ammo"]  = "Ammo: " + this.ammo;
        user_interface_string_manager.info_map["score"] = "Score: " + this.world.score;
        if(this.world.event_timer > 0){
          user_interface_string_manager.info_map["event"] = this.world.event;
          this.world.event_timer -= this.delta_time/1000;
        }
        else{
         user_interface_string_manager.info_map["event"] = ""; 
         this.world.event_timer = 0;
        }
      },
    //begin navigation interface
    'moveForward': function(newState){
	this.velocity[1]=newState?this.moveSpeed:0;
    },
    'moveBackward': function(newState){
	this.velocity[1]=newState?-this.moveSpeed:0;
    },
    'moveLeft': function(newState){
	this.velocity[0]=newState?-this.moveSpeed:0;
    },
    'moveRight': function(newState){
	this.velocity[0]=newState?this.moveSpeed:0;
    },
    //end navigation interface
    'changeHealth': function(deltaHealth){
	     this.health += deltaHealth;
       this.health = Math.min(this.health, this.maxHealth);
      
	     if(this.health <= 0){
	       this.dying = true;
       }
      },
    'changeAmmo': function(deltaAmmo){
      this.ammo += deltaAmmo;
      if(this.ammo > MAX_AMMO)
        this.ammo = MAX_AMMO;
      },
    'boostSpeed': function(deltaSpeed){
      if(this.buff_timer == 0.0)          // doesn't stack
        this.moveSpeed += deltaSpeed;
      this.buff_timer = 5.0;
      },
    'attack': function(){
  // Cannot shoot if player has no ammo
  var audio = new Audio('Audio/gunshot.mp3');
  
  if(this.ammo <= 0 || !this.alive )
    return;
	if(this.autoAttackTimer <= 0){
	    this.world.projectiles.push(new Bullet(this.world, this.heading, translation(this.position[0],this.position[1],this.position[2]+1)));
	    this.autoAttackTimer = ATTACK_TIMER;
      this.ammo--;
      if (!this.world.mute)
      {
        var audio = new Audio('Audio/gunshot.mp3');
        audio.play();
      }
	}
    },
    'display': function(delta_time)
      {
	  
    this.delta_time = delta_time;

    if(!this.alive){ 
      return;
    }
    
	  var graphics_state = this.world.shared_scratchpad.graphics_state;
	  var displacement = scale_vec(delta_time/1000, this.velocity);
	  if(this.dying) {
      displacement[0]=0; displacement[1]=0;
    }
	  this.autoAttackTimer -= delta_time/1000;

	  //change heading of player
	  if(dot(displacement,displacement) != 0){
	      this.heading = normalize(displacement.slice(0));
	  }

	  //try going to a new position
	  var newPosition = add(vec4(displacement[0],displacement[1],0,0),this.position);
	  if (this.world.checkEnemyCollision(this,newPosition,0.7) != -1 || this.world.collidesWithWall(newPosition,1.1)){
	      //do nothing
	  }

	  else if(this.world.checkBounds(newPosition)){
	      this.position=newPosition;
	      this.model_transform = mult(translation(displacement[0],displacement[1],0),this.model_transform);
	      //update camera matrix to follow the player
	      graphics_state.camera_transform = mult(graphics_state.camera_transform, translation(0,0,12));
	      graphics_state.camera_transform = mult(graphics_state.camera_transform,translation(-displacement[0],-displacement[1],0));
	      graphics_state.camera_transform = mult(graphics_state.camera_transform, translation(0,0,-12));
	  }

    //if a buff has been applied to a player, decrement timer. once it hits 0 or less, reset player to normal
    if(this.buff_timer > 0)
        this.buff_timer -= delta_time/1000;
    else if(this.buff_timer <= 0){
        this.moveSpeed = this.defaultSpeed;
        this.buff_timer = 0;
    }
	  //the member variable modelTransMat ONLY represents the (x,y) coordinates.
	  //must still build compound shapes using it as a basis (i.e. from the ground up)
	  var model_transform = this.model_transform; 
	  var headingAngle = Math.acos(dot(this.heading,vec4(0,1,0,0))) * 180/Math.PI * (this.heading[0]>0?-1:1);

    //if the player is dying, just fall back without any movement
    if(this.dying) 
    {
      if(this.fallAngle < 90)
      this.fallAngle+=10;
      if (this.fallAngle == 90 && this.fadeTimer > 0) 
      {
        this.fadeRate += 0.01;
        model_transform = mult(model_transform, translation(0, 0, -this.fadeRate));  
        this.fadeTimer -= delta_time/1000 ;
      }
      else if(this.fadeTimer <= 0)
      {
        this.alive = false;
        return;
      }                         // -y, x gives us the axis where the enemy will fall in its normal's direction
        model_transform = mult(model_transform, rotation(-this.fallAngle, -this.heading[1], this.heading[0],0));   
    }



	  //get body center and turn by heading angle
	  var body_center = model_transform = mult(mult(model_transform, translation(0,0,1.5)),rotation(headingAngle,0,0,1));

	  //body
	  model_transform = mult(model_transform, scale(0.7, 0.6, 0.8));
	  shapes_in_use.oriented_cube.draw(graphics_state, model_transform, this.materials.body);
	  
	  model_transform = body_center;
	  
	  //head
	  model_transform = mult(model_transform, translation(0,0,0.8));
	  model_transform = mult(model_transform, scale(0.4,0.4,0.4));    
	  shapes_in_use.oriented_cube.draw(graphics_state, model_transform, this.materials.head);

	  //get angle offsets for leg animation
	  var maxLimbAngle=30;
	  if(dot(displacement,displacement) > 0){
	      if(this.bool_reverseAnimate){
		  //angle rate of change calculated based on movement speed
		  this.limbAngle += this.moveSpeed/0.7*180/Math.PI*delta_time/1000
		  if(this.limbAngle > maxLimbAngle )
		      this.bool_reverseAnimate = !this.bool_reverseAnimate;
	      }
	      else{
		  this.limbAngle -= this.moveSpeed/0.7*180/Math.PI*delta_time/1000
		  if(this.limbAngle < -maxLimbAngle){
		      this.bool_reverseAnimate = !this.bool_reverseAnimate;
		  }
	      }
	  }
	  else
	      this.limbAngle=0;

	  // right leg	  
	  model_transform = body_center;
	  model_transform = mult(model_transform, translation(0.2,0,-0.7));               
    model_transform = mult(model_transform, rotation(-this.limbAngle, 1, 0, 0));
	  model_transform = mult(model_transform, translation(0,0,-0.3));
	  //always scale at end
	  model_transform = mult(model_transform, scale(0.15,0.15,0.8));	  

	  shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.default);
	  
	  // left leg	  
	  model_transform = body_center;
	  model_transform = mult(model_transform, translation(-0.2,0,-0.7));               
          model_transform = mult(model_transform, rotation(this.limbAngle, 1, 0, 0));
	  model_transform = mult(model_transform, translation(0,0,-0.3));
	  //always scale at end
	  model_transform = mult(model_transform, scale(0.15,0.15,0.8));	  

	  shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.default);
	  
	  // left arm
	  model_transform = body_center;  
	  model_transform = mult(model_transform, translation(-0.5,0,0.2));
          model_transform = mult(model_transform, rotation(-this.limbAngle, 1, 0, 0));
	  model_transform = mult(model_transform, translation(0,0,-0.2));
	  model_transform = mult(model_transform, rotation(20, 0, 1, 0));
	  model_transform = mult(model_transform, scale(0.1,0.1,0.5));
	  shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.default);

	  // right arm
	  model_transform = body_center;
	  model_transform = mult(model_transform, translation(0.5,0,0.2));
          model_transform = mult(model_transform, rotation(this.limbAngle, 1, 0, 0));
	  model_transform = mult(model_transform, translation(0,0,-0.2));
	  model_transform = mult(model_transform, rotation(-20, 0, 1, 0));
	  model_transform = mult(model_transform, scale(0.1,0.1,0.5));
	  shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.default);
     

    // health bar
    var scaling_factor = 1/this.maxHealth;
    for(var i = 0; i < this.health; i++){
        model_transform = mult(this.model_transform, translation(-0.5+(scaling_factor/2), 0, 2.8));          // center the bar
        model_transform = mult(model_transform, translation(scaling_factor*i, 0, 0));               // translate each bar
        model_transform = mult(model_transform, scale(scaling_factor, 0.1, 0.1));                   // scale to proportion
        var hpPercent = this.health/this.maxHealth;
        if(hpPercent < this.lowHPThres)
            shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.lowBar);
        else if(hpPercent < this.midHPThres)
            shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.midBar);
        else
            shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.fullBar);
    }   

  }
  });
