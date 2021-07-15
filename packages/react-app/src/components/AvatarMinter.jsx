import { Button, Input, Tooltip } from "antd";
import { BankOutlined } from "@ant-design/icons";

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

  1. Press (📝 Init Config)  to retrieve the config parameters from the ORA file.  
  2. Edit the <b>config.json</b> below with the desired generation parameters.
  3. Press (🎲 Generate) to start generating the images+metadata and to start uploading them to IPFS.
  4. Once generation is done, copy the resulting <b>metadata.json</b> to packages/avatar/src/metadata.json.
  5. To mint an NFT, specify an amount in the input field and then press <BankOutlined/>

  Client Side:
  <AvatarMinter/>

  Server Side:
  Copy the metadata json to packages/avatar/data/metadata.json

  ~ Features ~

  - Uses ERC-721
  - Define avatar specs easily
  - Assumes avatars are pre-minted for now
*/

// if initialized == false, use INIT_CONFIG. Otherwise specify config info here
const STARTING_CONFIG_JSON = {
    "filename": "config.json",
    "amountToMint": 10
};

const STARTING_METADATA_JSON = {
    "info": "metadata.json"
}

export default function AvatarMinter() {

    const [config, canvasRef, canvasWidth, canvasHeight, setNewAvatar, getMintingConfig] = useAvatar();
    const [configJSON, setConfigJSON] = useState(STARTING_CONFIG_JSON);
    const [metadataJSON, setMetadataJSON] = useState(STARTING_METADATA_JSON);

    const handleClickInitConfigButton = async (event) => {
        if (!STARTING_CONFIG_JSON.initialized)
        setConfigJSON(await getMintingConfig());
    }

    const handleClickMintButton = (event) => {
    }

    return (
        <div style={{ paddingTop: 32, width: 740, margin: "auto", textAlign: "left" }}>
            <h3>How to Mint</h3>
            <div style={{ paddingBottom: 8 }}>

            <div style={{ paddingBottom: 8 }}>
                    <b>[1a]</b> Edit <b>STARTING_CONFIG_JSON</b> in AvatarMinter.jsx directly, or,
                </div>

                <div style={{ paddingBottom: 8 }}>
                    <b>[1b]</b> Press
                    <span
                        className="highlight"
                        style={{ margin: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
                    >
                        📝 Init Config
                    </span>{" "}
                    to retrieve the config parameters from the ORA file, then 
                    edit the <b>config.json</b> below with the desired generation parameters.
                </div>

                <div style={{ paddingBottom: 8 }}>
                    <b>[2]</b> Press
                    <span
                        className="highlight"
                        style={{ margin: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
                    >
                        🎲 Generate
                    </span>{" "}
                    to start generating the images+metadata and to start uploading them to IPFS.
                </div>

                <div style={{ paddingBottom: 8 }}>
                    <b>[3]</b> Once generation is done, copy the resulting <b>metadata.json</b> to packages/avatar/src/metadata.json.
                </div>

                <div style={{ paddingBottom: 8 }}>
                    <b>[4]</b> To mint an NFT, specify an amount in the input field and then press
                    <span
                        className="highlight"
                        style={{ margin: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
                    >
                        <BankOutlined/>
                    </span>{" "}

                </div>


            </div>

            <div style={{ paddingBottom: 16 }} >
                <span style={{ width: "50%" }}>
                    <Button
                        style={{ marginRight: 8 }}
                        onClick={handleClickInitConfigButton}
                        size="large"
                        shape="round"
                    >
                        <span style={{ marginRight: 8 }}>
                            <span role="img" aria-label="fuelpump">
                                📝
                            </span>
                        </span>
                        Init Config
                    </Button>

                    <Button
                        style={{ marginRight: 8 }}
                        onClick={handleClickMintButton}
                        size="large"
                        shape="round"
                    >
                        <span style={{ marginRight: 8 }}>
                            <span role="img" aria-label="fuelpump">
                                🎲
                            </span>
                        </span>
                        Generate
                    </Button>



                    <Input style={{ width: "50%" }}
                        size="large"
                        placeholder={"amount to mint"}
                        onChange={e => {
                        }}
                        suffix={
                            <Tooltip title="Mint: Mint the specified quantity to current wallet.">
                                <Button
                                    onClick={() => {
                                    }}
                                    shape="circle"
                                    icon={<BankOutlined />}
                                />
                            </Tooltip>
                        }
                    />
                </span>
            </div>

            <div style={{ display: "none" }}>
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
