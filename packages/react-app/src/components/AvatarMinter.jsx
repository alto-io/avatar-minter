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
    "amountToCreate": 10
};

const STARTING_METADATA_JSON = {
    "filename": "metadata.json"
}

export default function AvatarMinter() {

    const [canvasRef, canvasWidth, canvasHeight, setNewAvatar, getMintingConfig, generateMetadataJson, setMintingConfig] = useAvatar();
    const [mintingConfigJSON, setMintingConfigJSON] = useState(STARTING_CONFIG_JSON);
    const [metadataJSON, setMetadataJSON] = useState(STARTING_METADATA_JSON);

    const handleClickInitConfigButton = async (event) => {
        setMintingConfigJSON(await getMintingConfig());
    }

    const handleClickMintButton = async (event) => {
        setMetadataJSON(await generateMetadataJson());
    }

    const handleClickDrawButton = async (event) => {
        var metadataArray = metadataJSON.tokenMetadata;
        if (metadataArray != undefined) {
            for (var token of metadataArray) {
                console.log(token);
            }
        }
    }

    const handleClickUploadButton = async (event) => {
    }

    return (
        <div style={{ paddingTop: 32, width: 740, margin: "auto", textAlign: "left" }}>
            <h3>How to Mint</h3>
            <div style={{ paddingBottom: 8 }}>

                <div style={{ paddingBottom: 8 }}>
                    <b>[1a]</b> Press
                    <span
                        className="highlight"
                        style={{ margin: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
                    >
                        📝 Initialize
                    </span>{" "}
                    to retrieve the config parameters from the ORA file, then 
                    edit the <b>config.json</b> below with the desired generation parameters, OR
                </div>

                <div style={{ paddingBottom: 8 }}>
                    <b>[1b]</b> Edit <b>STARTING_CONFIG_JSON</b> in AvatarMinter.jsx directly
                </div>

                <div style={{ paddingBottom: 8 }}>
                    <b>[2]</b> Press
                    <span
                        className="highlight"
                        style={{ margin: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
                    >
                        🎲 Generate
                    </span>{" "}
                    to start generating the metadata, which can be found under <b>tokenMetadata</b>.
                </div>

                <div style={{ paddingBottom: 8 }}>
                    <b>[3]</b> Press
                    <span
                        className="highlight"
                        style={{ margin: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
                    >
                        🎨 Draw
                    </span>{" "}
                    to start drawing the images.
                </div>

                <div style={{ paddingBottom: 8 }}>
                    <b>[4]</b> Press
                    <span
                        className="highlight"
                        style={{ margin: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
                    >
                        ⬆ Upload
                    </span>{" "}
                    to upload the images to IPFS.
                </div>

                <div style={{ paddingBottom: 8 }}>
                    <b>[5]</b> Once generation is done, copy the resulting <b>metadata.json</b> to packages/avatar/src/metadata.json.
                </div>

                <div style={{ paddingBottom: 8 }}>
                    <b>[6]</b> To mint an NFT, specify an amount in the input field and then press
                    <span
                        className="highlight"
                        style={{ margin: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
                    >
                        <BankOutlined/>
                    </span>{" "}
                </div>
                <div style={{ paddingBottom: 8 }}>
                    <b>[7]</b> Once minting is done, upload metadata.json to IPFS and call <b>setTokenURI</b> to the IPFS hash. This will reveal the NFTs to the owners on NFT marketplaces.
                </div>

            </div>

            <div style={{ paddingBottom: 16 }} >
                <span style={{ width: "100%" }}>
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
                        Initialize
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

                    <Button
                        style={{ marginRight: 8 }}
                        onClick={handleClickDrawButton}
                        size="large"
                        shape="round"
                    >
                        <span style={{ marginRight: 8 }}>
                            <span role="img" aria-label="fuelpump">
                                🎨
                            </span>
                        </span>
                        Draw
                    </Button>

                    <Button
                        style={{ marginRight: 8 }}
                        onClick={handleClickUploadButton}
                        size="large"
                        shape="round"
                    >
                        <span style={{ marginRight: 8 }}>
                            <span role="img" aria-label="fuelpump">
                                ⬆
                            </span>
                        </span>
                        Upload
                    </Button>



                    <Input style={{ width: "100%", marginTop: 16 }}
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
                    src={mintingConfigJSON}
                    theme="pop"
                    enableClipboard={false}
                    onEdit={(edit, a) => {
                        setMintingConfigJSON(edit.updated_src);
                        setMintingConfig(edit.updated_src);
                    }}
                    onAdd={(add, a) => {
                        setMintingConfigJSON(add.updated_src);
                        setMintingConfig(add.updated_src);                        
                    }}
                    onDelete={(del, a) => {
                        setMintingConfigJSON(del.updated_src);
                        setMintingConfig(del.updated_src);
                    }}
                />
            </div>

            <div>
                <ReactJson
                    style={{ padding: 8 }}
                    src={metadataJSON}
                    theme="pop"
                    enableClipboard={false}
                />
            </div>

        </div>

    );
}
