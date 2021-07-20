import React, { useEffect, useState } from "react";
import Phaser from "phaser";

export function ClawGame() {
    useEffect(() => {
        class ClawGameDemo extends Phaser.Scene {
            constructor() {
                super();
            }

            preload() {
                var pageBody = document.getElementById("container-game");
                pageBody.style.backgroundImage = "url('./assets/Backgrounds/backgroundColorForest.png')";
                pageBody.style.backgroundPosition = "center";
                /* pageBody.style.backgroundRepeat = "no-repeat";*/
                pageBody.style.backgrounSize = "cover";
                pageBody.style.backgroundColor = "gold";
                pageBody.style.backgroundBlendMode = "multiply";

                this.load.image("rope", "./assets/Items/chain.png");

                this.load.image("spikes", "./assets/Items/spikes.png");

                this.boxTextureNames = [];

                this.load.image("box", "./assets/Tiles/box.png");
                this.boxTextureNames.push("box");

                this.load.image("boxAlt", "./assets/Tiles/boxAlt.png");
                this.boxTextureNames.push("boxAlt");

                this.load.image("boxCoin", "./assets/Tiles/boxCoin.png");
                this.boxTextureNames.push("boxCoin");

                this.load.image("boxCoinAlt", "./assets/Tiles/boxCoinAlt.png");
                this.boxTextureNames.push("boxCoinAlt");

                this.load.image("boxCoin_disabled", "./assets/Tiles/boxCoin_disabled.png");
                this.boxTextureNames.push("boxCoin_disabled");

                this.load.image("boxCoinAlt_disabled", "./assets/Tiles/boxCoinAlt_disabled.png");
                this.boxTextureNames.push("boxCoinAlt_disabled");

                this.load.image("boxEmpty", "./assets/Tiles/boxEmpty.png");
                this.boxTextureNames.push("boxEmpty");

                this.load.image("boxExplosive", "./assets/Tiles/boxExplosive.png");
                this.boxTextureNames.push("boxExplosive");

                this.load.image("boxExplosiveAlt", "./assets/Tiles/boxExplosiveAlt.png");
                this.boxTextureNames.push("boxExplosiveAlt");

                this.load.image("boxExplosive_disabled", "./assets/Tiles/boxExplosive_disabled.png");
                this.boxTextureNames.push("boxExplosive_disabled");

                this.load.image("boxItem", "./assets/Tiles/boxItem.png");
                this.boxTextureNames.push("boxItem");

                this.load.image("boxItemAlt", "./assets/Tiles/boxItemAlt.png");
                this.boxTextureNames.push("boxItemAlt");

                this.load.image("boxItemAlt_disabled", "./assets/Tiles/boxItemAlt_disabled.png");
                this.boxTextureNames.push("boxItemAlt_disabled");

                this.load.image("boxItem_disabled", "./assets/Tiles/boxItem_disabled.png");
                this.boxTextureNames.push("boxItem_disabled");

                this.load.image("boxWarning", "./assets/Tiles/boxWarning.png");
                this.boxTextureNames.push("boxWarning");

                this.boxColors = [0xfa5a25, 0xf0eb24, 0xbe17fa, 0x24f0c1, 0x245df0];

                this.load.image("backgroundEmpty", "./assets/Backgrounds/backgroundForest.png");
            }

            create() {
                this.backgroundImage = this.add.image(game.config.width * 0.5, game.config.height * 0.5, "backgroundEmpty");

                this.matter.world.setBounds(0, 0, game.config.width, game.config.height);
                this.matter.add.mouseSpring();

                this.clawLimit = 25;

                this.clawRope = this.add.tileSprite(game.config.width * 0.5, this.clawLimit, 70, 1000, "rope");
                this.clawRope.setOrigin(0.5, 1);
                this.clawRope.z = 500;
                console.log(this.clawRope);
                //this.clawRope.height = 200;
                //this.clawRope.setScale(2);
                //this.clawRope.setStatic(true);
                this.clawHead = this.matter.add.sprite(this.clawRope.x, this.clawRope.y, "spikes");
                this.clawHead.setOrigin(0.5, 0.5);
                this.clawHead.setStatic(true);
                this.clawHead.setAngle(180);

                this.cursors = this.input.keyboard.createCursorKeys();

                this.boxes = [];
                for (let i = 0; i < 30; i++) {
                    this.boxes.push(
                        this.matter.add
                            .sprite(
                                game.config.width * Math.random(),
                                game.config.height * 0.5 + game.config.height * 0.5 * Math.random(),
                                this.boxTextureNames[Math.floor(this.boxTextureNames.length * Math.random())],
                            )
                            .setBounce(0.25),
                    );

                    this.boxes[i].tint =
                        Math.random() >= 0.25 ? this.boxColors[Math.floor(this.boxColors.length * Math.random())] : 0xffffff;
                }

                this.matter.world.on("collisionstart", function (event, bodyA, bodyB) {
                    //console.log(bodyA.gameObject, bodyB.gameObject);
                    //bodyB.gameObject.tint = 0xFF0000;
                });

                //Phaser.Scale.updateCenter();
            }

            update(time, delta) {
                let computedDelta = delta / ((1 / 60) * 1000);
                if (this.cursors.left.isDown) {
                    if (this.clawRope.x - 10 * computedDelta > 0 + 35) {
                        this.clawRope.x -= 10 * computedDelta;
                    }
                }
                if (this.cursors.right.isDown) {
                    if (this.clawRope.x + 10 * computedDelta < game.config.width - 35) this.clawRope.x += 10 * computedDelta;
                }

                if (this.cursors.space.isDown) {
                    if (this.clawRope.y + 10 * computedDelta < game.config.height * 0.75) {
                        this.clawRope.y += 10 * computedDelta;
                    }
                } else {
                    if (this.clawRope.y - 10 * computedDelta > this.clawLimit) {
                        this.clawRope.y -= 10 * computedDelta;
                    }
                }

                this.clawHead.x = this.clawRope.x;
                this.clawHead.y = this.clawRope.y + 30;
            }
        }

        const config = {
            type: Phaser.AUTO,
            backgroundColor: "#FFFFFF",
            scale: {
                parent: "claw-game",
                mode: Phaser.Scale.FIT,
                width: 800,
                height: 800,
            },
            scene: ClawGameDemo,
            physics: {
                default: "matter",
                matter: {
                    debug: false,
                    gravity: { y: 0.5 },
                },
            },
        };

        const game = new Phaser.Game(config);

        return () => {
            game.destroy(false, false);
        };
    }, []);

    return (
        <div
            id="container-game"
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <div id="claw-game"></div>
        </div>
    );
}
