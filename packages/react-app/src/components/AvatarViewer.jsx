import { Button } from "antd";
import React, { useState } from "react";

import { useAvatar } from "../hooks";

import ReactJson from "react-json-view";

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

const STARTING_CONFIG_JSON = {
    "info": "this will contain config.json that defines the collection specs. Edit as necessary."
  };

const STARTING_METADATA_JSON = {
    "info": "this will contain metadata.json once minting is complete."
}
  
export default function AvatarViewer() {

    const [config, canvasRef, canvasWidth, canvasHeight, setNewAvatar] = useAvatar();
    const [configJSON, setConfigJSON] = useState(STARTING_CONFIG_JSON);
    const [metadataJSON, setMetadataJSON] = useState(STARTING_METADATA_JSON);

    const handleClickNewAvatarButton = (event) => {
        setNewAvatar(); 
        setConfigJSON(config);
    }

    return (
        <div style={{ paddingTop: 32, width: 740, margin: "auto", textAlign: "left" }}>
            <div>
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

            <div>
                <canvas
                    className="Avatar-canvas"
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                />
            </div>
            <div>
                <ReactJson
                    style={{ padding: 8 }}
                    src={configJSON}
                    theme="pop"
                    enableClipboard={false}
                    onEdit={(edit, a) => {
                        setConfigJSON(edit.updated_src);
                    }}
                    onAdd={(add, a) => {
                        setConfigJSON(add.updated_src);
                    }}
                    onDelete={(del, a) => {
                        setConfigJSON(del.updated_src);
                    }}
                />
            </div>

            <div>
                <ReactJson
                    style={{ padding: 8 }}
                    src={metadataJSON}
                    theme="pop"
                    enableClipboard={false}
                    onEdit={(edit, a) => {
                        setConfigJSON(edit.updated_src);
                    }}
                    onAdd={(add, a) => {
                        setConfigJSON(add.updated_src);
                    }}
                    onDelete={(del, a) => {
                        setConfigJSON(del.updated_src);
                    }}
                />
            </div>

        </div>

    );
}
