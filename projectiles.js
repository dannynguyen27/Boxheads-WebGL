Declare_Any_Class( "Projectile", 
  { 'construct': function( worldHandle, shooterHeading, modelTransMat=mat4())
    {     this.define_data_members({ world: worldHandle, model_transform: modelTransMat,position: mult_vec(modelTransMat,vec4(0,0,0,1)), 
				     moveSpeed: 10, velocity: scale_vec(15,shooterHeading), alive: true,  materials:{}});
	  this.position[2]=0;
	  this.materials.body = new Material(Color(1.0,0.4,0,1),1,.8,0,10);
    },
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
      {
	  //TODO: may want to update UI with player info later on
        /*user_interface_string_manager.string_map["time"]    = "Animation Time: " + Math.round( this.shared_scratchpad.graphics_state.animation_time )/1000 + "s";
        user_interface_string_manager.string_map["animate"] = "Animation " + (this.shared_scratchpad.animate ? "on" : "off") ;*/
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
    'display': function(delta_time)
      {
	  if(!this.alive) return;
	  var graphics_state = this.world.shared_scratchpad.graphics_state;
	  var displacement = scale_vec(delta_time/1000, this.velocity);
	  
	  var newPosition = add(vec4(displacement[0],displacement[1],0,0),this.position);

	  var enemyID = this.world.checkEnemyCollision(this,this.position,0.4);
	  if(enemyID != -1){
	      this.alive=false;
	      this.world.enemies[enemyID].changeHealth(-1);
        this.world.enemies[enemyID].recoil();
        var audio = new Audio('dog_hurt.mp3');
        audio.play();
	  }
	  else if(this.world.checkBounds(newPosition)){
	      this.position=newPosition;
	      this.model_transform = mult(translation(displacement[0],displacement[1],0),this.model_transform);
	  }
	  else{
	      this.alive=false;
	  }
	  //the member variable modelTransMat ONLY represents the (x,y) coordinates.
	  var model_transform = this.model_transform; 
	  model_transform = mult(model_transform, translation(0,0,0.5));
	  model_transform = mult(model_transform, scale(0.1,0.1,0.1));
	  shapes_in_use.sphere.draw(graphics_state, model_transform, this.materials.body);
      }
  });