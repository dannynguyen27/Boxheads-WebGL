Declare_Any_Class( "AmmoCrate",              
  { 'construct': function( worldHandle, crateType, modelTransMat=mat4())   // crateTypes: 0: ammo refill, 1: health refill, 2: speed boost, 3: troll box
    {     
      this.define_data_members({ 
          world: worldHandle, model_transform: modelTransMat,position: mult_vec(modelTransMat,vec4(0,0,0,1)), 
          alive: true, type:crateType, rotationSpeed:0, timeAlive:0, materials:{}
        });
    this.position[2]=0;

    // Normal Brown Crate Color
    //this.materials.body = new Material(Color(0.424,0.353,0.298,1),1,.8,0,10);
    this.materials.ammo = new Material(Color(0,0,0,1),0.8,.4,0,10, "Visuals/Crates/ammo.jpg");
    this.materials.health = new Material(Color(0,0,0,1),0.8,.4,0,10, "Visuals/Crates/health.jpg");
    this.materials.speed = new Material(Color(0,0,0,1),0.8,.4,0,10, "Visuals/Crates/speed.jpg");
    //this.materials.troll = new Material(Color(0,0,0,1),0.8,.4,0,10, "Memes/Troll_Lose_Ammo.jpg");
    },
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
      {
    //TODO: may want to update UI with player info later on
        /*user_interface_string_manager.string_map["time"]    = "Animation Time: " + Math.round( this.shared_scratchpad.graphics_state.animation_time )/1000 + "s";
        user_interface_string_manager.string_map["animate"] = "Animation " + (this.shared_scratchpad.animate ? "on" : "off") ;*/
      },
    'display': function(delta_time)
      {
    if(!this.alive) return;

    // This regulates how long a crate stays on the screen
    if (this.timeAlive >= CRATE_DESPAWN_TIMER)
    {
      this.alive = false;
      return;
    }
    else
      this.timeAlive += delta_time/1000;

    var graphics_state = this.world.shared_scratchpad.graphics_state;
    var audio;

    if (this.world.checkPlayerCollision(this.position, 1))
    {
      this.world.event_timer = 2.5;

      var ammoIndex = Math.floor(Math.random() * NUM_GUNS);
      switch(this.type)
      {
        case AMMO_BOX:
          this.world.player.changeAmmo(ammoIndex, AMMO_PER_CRATE);
          if (!this.world.mute)
          {
            audio = new Audio('Audio/reload.mp3');
            audio.play();
          }
          switch(ammoIndex)
          {
            case 0:
              this.world.event = "Picked up: Pistol Crate";
              break;
            case 1:
              this.world.event = "Picked up: UZI Crate";
              break;
            case 2:
              this.world.event = "Picked up: Shotgun Crate";
              break;
          }
          this.alive = false;
          return;
        case HEALTH_BOX:
          this.world.player.changeHealth(20);
          if (!this.world.mute)
          {
            audio = new Audio('Audio/health.mp3');
            audio.play();
          }
          this.world.event = "Picked up: Health Crate";
          this.alive = false;
          return;
        case SPEED_BOX:
          this.world.player.boostSpeed(2);
          if (!this.world.mute)
          {
            audio = new Audio('Audio/thunder.mp3');
            audio.play();
          }
          this.world.event = "Picked up: Speed Crate"; 
          this.alive = false;
          return;
        /*
        case TROLL_BOX:
          // TODO: ADD EXTRA TROLL FUNCTIONALITY
          console.log("Troll crate opened! You get:");
          randomPowerUp = Math.random()
          this.world.event = "Picked up: Troll Box";
          this.alive = false;
          return;
        */
      }

    }

    this.rotationSpeed+=(36*delta_time/1000);

    //the member variable modelTransMat ONLY represents the (x,y) coordinates.
    var model_transform = this.model_transform; 
    model_transform = mult(model_transform, translation(0, 0, 1));
    model_transform = mult(model_transform, scale(0.75, 0.75, 0.75));
    model_transform = mult(model_transform, rotation(this.rotationSpeed, 0, 0, 1));

    switch(this.type)
    {
      case AMMO_BOX:
        shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.ammo);
        break;
      case HEALTH_BOX:
        shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.health);
        break;
      case SPEED_BOX:
        shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.speed);
        break;
      /*
      case TROLL_BOX:
        shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.troll);
        break;
      */
    }
      }
  });