// UCLA's Graphics Example Code (Javascript and C++ translations available), by Garett Ridge for CS174a.
// example-shaders.js:  Fill in this file with subclasses of Shader, each of which will store and manage a complete GPU program.

// ******* THE DEFAULT SHADER: Phong Shading Model with Gouraud option *******
Declare_Any_Class( "Phong_or_Gouraud_Shader",
  { 'update_uniforms'          : function( g_state, model_transform, material )     // Send javascrpt's variables to the GPU to update its overall state.
      {
          let [ P, C, M ]  = [ g_state.projection_transform, g_state.camera_transform, model_transform ],   // PCM will mean Projection * Camera * Model
          CM             = mult( C,  M ),
          PCM            = mult( P, CM ),                               // Send the current matrices to the shader.  Go ahead and pre-compute the products
          inv_trans_CM   = toMat3( transpose( inverse( CM ) ) );        // we'll need of the of the three special matrices and just send those, since these
                                                                        // will be the same throughout this draw call & across each instance of the vertex shader.
        gl.uniformMatrix4fv( g_addrs.camera_transform_loc,                  false, flatten(  C  ) );
        gl.uniformMatrix4fv( g_addrs.camera_model_transform_loc,            false, flatten(  CM ) );
        gl.uniformMatrix4fv( g_addrs.projection_camera_model_transform_loc, false, flatten( PCM ) );
        gl.uniformMatrix3fv( g_addrs.camera_model_transform_normal_loc,     false, flatten( inv_trans_CM ) );

        if( g_state.gouraud === undefined ) { g_state.gouraud = g_state.color_normals = false; }    // Keep the flags seen by the shader program
        gl.uniform4fv( g_addrs.shapeColor_loc,     material.color       );    // Send a desired shape-wide color to the graphics card
        gl.uniform1f ( g_addrs.ambient_loc,        material.ambient     );
        gl.uniform1f ( g_addrs.diffusivity_loc,    material.diffusivity );
	gl.uniform1f ( g_addrs.shininess_loc, material.shininess);
        gl.uniform1f ( g_addrs.smoothness_loc,     material.smoothness  );
        gl.uniform1f ( g_addrs.animation_time_loc, g_state.animation_time / 1000 );
        if( !g_state.lights.length )  return;
        var lightPositions_flattened = [], lightColors_flattened = []; lightAttenuations_flattened = [];
        for( var i = 0; i < 4 * g_state.lights.length; i++ )
          { lightPositions_flattened                  .push( g_state.lights[ Math.floor(i/4) ].position[i%4] );
            lightColors_flattened                     .push( g_state.lights[ Math.floor(i/4) ].color[i%4] );
            lightAttenuations_flattened[ Math.floor(i/4) ] = g_state.lights[ Math.floor(i/4) ].attenuation;
          }
        gl.uniform4fv( g_addrs.lightPosition_loc,       lightPositions_flattened );
        gl.uniform4fv( g_addrs.lightColor_loc,          lightColors_flattened );
        gl.uniform1fv( g_addrs.attenuation_factor_loc,  lightAttenuations_flattened );
      },
    'vertex_glsl_code_string'  : function()           // ********* VERTEX SHADER *********
      { return `
          // The following string is loaded by our javascript and then used as the Vertex Shader program.  Our javascript sends this code to the graphics card at runtime, where on each run it gets
          // compiled and linked there.  Thereafter, all of your calls to draw shapes will launch the vertex shader program once per vertex in the shape (three times per triangle), sending results on
          // to the next phase.  The purpose of this program is to calculate the final resting place of vertices in screen coordinates; each of them starts out in local object coordinates.

          precision mediump float;
          const int N_LIGHTS = 1;               // Be sure to keep this line up to date as you add more lights

          attribute vec3 vPosition, vNormal, vTangent;
          attribute vec2 vTexCoord;
          varying vec2 fTexCoord;
          varying vec3 N, E, pos;

          uniform float ambient, diffusivity, shininess, smoothness, animation_time, attenuation_factor[N_LIGHTS];
          uniform bool BUMP_MAP;    // Flags for alternate shading methods

          uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS], shapeColor;
          varying vec4 VERTEX_COLOR;
          varying vec3 L[N_LIGHTS], H[N_LIGHTS];
          varying float dist[N_LIGHTS];

          uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
          uniform mat3 camera_model_transform_normal;

          void main()
          {
            N = normalize( camera_model_transform_normal * vNormal );
	      vec3 T;
	      vec3 B;
	    if(BUMP_MAP){
		T = normalize( camera_model_transform_normal * vTangent);
		B = cross(N, T);
	    }

            vec4 object_space_pos = vec4(vPosition, 1.0);
            gl_Position = projection_camera_model_transform * object_space_pos;
            fTexCoord = vTexCoord;

            pos = ( camera_model_transform * object_space_pos ).xyz;
            E = normalize( -pos );

            for( int i = 0; i < N_LIGHTS; i++ )
            {
		if(BUMP_MAP){
		    L[i].x = dot(T, ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * pos );
		    L[i].y = dot(B, ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * pos );
		    L[i].z = dot(N, ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * pos );
		    L[i] = normalize(L[i]);
		}
		else L[i] = normalize( ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * pos );   // Use w = 0 for a directional light -- a vector instead of a point.
              //halfway vector for Blinn-Phong model: the vector halfway between the vector to the light source L and the vector to the observer
              H[i] = normalize( L[i] + E );
                                                                                // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
              dist[i]  = lightPosition[i].w > 0.0 ? distance((camera_transform * lightPosition[i]).xyz, pos) : distance( attenuation_factor[i] * -lightPosition[i].xyz, object_space_pos.xyz );
            }
          }`;
      },
    'fragment_glsl_code_string': function()           // ********* FRAGMENT SHADER *********
      { return `
          // Likewise, the following string is loaded by our javascript and then used as the Fragment Shader program, which gets sent to the graphics card at runtime.  The fragment shader runs
          // once all vertices in a triangle / element finish their vertex shader programs, and thus have finished finding out where they land on the screen.  The fragment shader fills in (shades)
          // every pixel (fragment) overlapping where the triangle landed.  At each pixel it interpolates different values from the three extreme points of the triangle, and uses them in formulas
          // to determine color.

          precision mediump float;

          const int N_LIGHTS = 1;

          uniform vec4 lightColor[N_LIGHTS], shapeColor;
          varying vec3 L[N_LIGHTS], H[N_LIGHTS];
          varying float dist[N_LIGHTS];
          varying vec4 VERTEX_COLOR;

          uniform float ambient, diffusivity, shininess, smoothness, animation_time, attenuation_factor[N_LIGHTS];

          varying vec2 fTexCoord;   // per-fragment interpolated values from the vertex shader
          varying vec3 N, E, pos;

          uniform sampler2D texture;
	  uniform sampler2D bumpTexture;
          uniform bool BUMP_MAP, USE_TEXTURE;

          void main()
          {
            vec4 tex_color = texture2D( texture, fTexCoord );
            gl_FragColor = tex_color * ( USE_TEXTURE ? ambient : 0.0 ) + vec4( shapeColor.xyz * ambient, USE_TEXTURE ? shapeColor.w * tex_color.w : shapeColor.w ) ;
            for( int i = 0; i < N_LIGHTS; i++ )
            {
		//simulates the lowering of light intensity with distance from the object
		float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
		float diffuse;
		float specular;
		if(BUMP_MAP){
		    vec4 bumpN = texture2D(bumpTexture, fTexCoord);
		    vec3 scaledBumpN = normalize(2.0*bumpN.xyz - 1.0);
		    vec3 LL = normalize(L[i]);
		    diffuse = max(dot(LL,scaledBumpN),0.0);
		    specular = pow(max(dot(H[i],scaledBumpN),0.0),smoothness);
		}
		else{
		    //use the angle between the light source and the normal at the surface to determine how much light is reflected; use the max
		    //function to prevent negative values
		    diffuse = max(dot(L[i],N),0.0);
		    //use the angle between the halfway vector and the normal (Blinn-Phong model) to calculate the specular lighting intensity
		    specular = pow(max(dot(H[i],N),0.0),smoothness);
		}
		gl_FragColor.xyz += attenuation_multiplier * (tex_color.xyz * diffusivity * diffuse  + lightColor[i].xyz * shininess * specular );
            }
            gl_FragColor.a = gl_FragColor.w;
          }`;
      }
  }, Shader );
