import { Button } from "antd";
import React from "react";

import { useAvatar } from "../hooks";

/*
  ~ What it does? ~

  Create your own Avatar NFTs!

  Processes an OpenRaster (.ora) file of generative avatars
  to upload generative avatars to IPFS and create a metadata
  json file usable for tokenUris.
  
  See packages/avatar/img/ for examples of .ora files.
  .ora files can be exported from PSD files via GIMP.

  ~ How can I use? ~

  Put your .ora file in public/avatars/avatarimages.ora

  Client Side:
  <Avatar/>

  Server Side:
  Copy the metadata json to packages/avatar/data/metadata.json

  ~ Features ~

  - Uses ERC-721
  - Define avatar specs easily
  - Assumes avatars are pre-minted for now
*/

export default function Avatar() {

    const [config, canvasRef, canvasWidth, canvasHeight, setNewAvatar] = useAvatar();


    const handleClickNewAvatarButton = (event) => {
        setNewAvatar();
    }

    return (
        <div style={{ paddingTop: 32, width: 740, margin: "auto", textAlign: "left" }}>
        <div>
            <canvas
                className="Avatar-canvas"
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
            />
</div>
            <Button
                onClick={handleClickNewAvatarButton}
                size="large"
                shape="round"
            >
                <span style={{ marginRight: 8 }}>
                    <span role="img" aria-label="fuelpump">
                        😀
                    </span>
                </span>
                New Avatar
            </Button>

        </div>
    );
}
