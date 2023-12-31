import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { A, D, DIRECTIONS, S, W } from './utils.js';

export class CharacterControls {
    constructor(model, mixer, animationsMap, orbitControl, camera, currentAction) {
        this.model = model;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.orbitControl = orbitControl;
        this.camera = camera;
        this.fadeDuration = 0.2;
        this.runVelocity = 7;
        this.walkVelocity = 2;
        this.toggleRun = true;
        this.currentAction = currentAction;
        this.walkDirection = new THREE.Vector3();
        this.rotateAngle = new THREE.Vector3(0, 1, 0);
        this.virtualModelPosition = new THREE.Vector3();
        this.rotateQuarternion = new THREE.Quaternion();
        this.cameraTarget = new THREE.Vector3();
        this.bindCamera = true
        this.animationsMap.forEach((value, key) => {
            if (key == currentAction) {
                value.play();
            }
        });

        this.updateCameraTarget(0, 0);
    }

    switchRunToggle() {
        this.toggleRun = !this.toggleRun;
    }

    freeCamera() {
        this.bindCamera = !this.bindCamera;
        console.log("Free Camera !!");
    }

    getBindCamera() {
        return this.bindCamera;
    }

    update(delta, keysPressed) {
        if(this.bindCamera) {
            const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true);

            var play = '';
            if (directionPressed && this.toggleRun) {
                play = 'Run';
            } else if (directionPressed) {
                play = 'Walk';
            } else {
                play = 'Idle';
            }

            if (this.currentAction != play) {
                const toPlay = this.animationsMap.get(play);
                const current = this.animationsMap.get(this.currentAction);

                current.fadeOut(this.fadeDuration);
                toPlay.reset().fadeIn(this.fadeDuration).play();

                this.currentAction = play;
            }

            this.mixer.update(delta);

            if (this.currentAction == 'Run' || this.currentAction == 'Walk') {
                // calculate towards camera direction
                var angleYCameraDirection = Math.atan2(
                    this.camera.position.x - this.model.position.x,
                    this.camera.position.z - this.model.position.z
                );
                // diagonal movement angle offset
                var directionOffset = this.directionOffset(keysPressed);

                // rotate model
                this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset);
                this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);

                // calculate direction
                this.camera.getWorldDirection(this.walkDirection);
                this.walkDirection.y = 0;
                this.walkDirection.normalize();
                this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);

                // run/walk velocity
                const velocity = this.currentAction == 'Run' ? this.runVelocity : this.walkVelocity;

                // move model & camera
                const moveX = this.walkDirection.x * velocity * delta;
                const moveZ = this.walkDirection.z * velocity * delta;
                
                this.model.position.x += moveX;
                this.model.position.z += moveZ;
                this.updateCameraTarget(moveX, moveZ);
            
            }
        }
    }

    updateCameraTarget(moveX, moveZ) {
        // move camera
        this.camera.position.x += moveX;
        this.camera.position.z += moveZ;

        // update camera target
        this.cameraTarget.x = this.model.position.x;
        this.cameraTarget.y = this.model.position.y + 1.5;
        this.cameraTarget.z = this.model.position.z;
        this.orbitControl.target = this.cameraTarget;
    }

    directionOffset(keysPressed) {
        var directionOffset = 0; // w

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4; // w+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4; // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2; // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2; // s+d
            } else {
                directionOffset = Math.PI; // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2; // a
        } else if (keysPressed[D]) {
            directionOffset = -Math.PI / 2; // d
        }

        return directionOffset;
    }
}

// Export the class
// module.exports = CharacterControls;
