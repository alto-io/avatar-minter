import { Button, Input, Tooltip } from "antd";
import { BankOutlined } from "@ant-design/icons";

import React, { useState, useEffect } from "react";

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
    initialized: false,
};

export default function AvatarMinter(props) {
    const callSetURI = props.callSetURI;
    const callMintMultiple = props.callMintMultiple;

    const [
        canvasRef,
        dataParts,
        loadProject,
        fillImageData,
        fillBackgroundData,
        fillPetsData,
        reloadConfig,
        getAvatar,
        infoDataParts,
        setInfoDataParts,
        holdDataParts,
        setHoldDataParts,
        project,
        changeAvatarColor,
        finalRender,
        canvasWidth,
        canvasHeight,
        setNewAvatar,
        getMintingConfig,
        generateMetadataJson,
        setMintingConfig,
        setMetadataJson,
        metadataJson,
        uploadedTokenURI,
        startIPFSUpload,
        ipfsHash,
        classOptions,
        setSelectedClass,
        selectedClass,
        configTree,
        setConfigTree,
        lootText,
    ] = useAvatar();
    const [mintingConfigJSON, setMintingConfigJSON] = useState(STARTING_CONFIG_JSON);

    const [sending, setSending] = useState();
    const [mintAmount, setMintAmount] = useState();

    useEffect(() => {
        /*  async function load() {
                         await loadProject();
                     }
                     load(); */

        //console.log(project);

        window.nextRender = true;

        if (localStorage.getItem("myParts") === null) {
            let myParts = {};
            localStorage.setItem("myParts", JSON.stringify(myParts));
        }

        if (localStorage.getItem("myAvatars") === null) {
            let myAvatars = [];
            localStorage.setItem("myAvatars", JSON.stringify(myAvatars));
            setMetadataJson(myAvatars);
        } else {
            let currentAvatars = JSON.parse(localStorage.getItem("myAvatars"));
            console.log(`We already have ${currentAvatars.length} avatars!`);
            setMetadataJson(currentAvatars);
        }
    }, []);

    const handleClickInitConfigButton = async event => {
        setMintingConfigJSON(await getMintingConfig());
    };

    const handleClickGenerateButton = async event => {
        generateMetadataJson(mintingConfigJSON);
        //singleClassGenerateMetadataJson(mintingConfigJSON);
    };

    const handleClickUploadButton = async event => {
        setSending(true);
        startIPFSUpload().then(() => {
            setTimeout(() => {
                setSending(false);
            }, 1);
        });
    };

    const handleDrawAvatar = async (paramCount, myCurrentData, totalAvatars) => {
        let currentAvatars = JSON.parse(localStorage.getItem("myAvatars"));
        let selectedAvatar = currentAvatars[paramCount];

        let stuffToRender = [];
        let selectedParts = Object.keys(selectedAvatar);
        for (let i = 0; i < myCurrentData.length; i++) {
            for (let j = 0; j < selectedParts.length; j++) {
                if (selectedAvatar[selectedParts[j]].name === myCurrentData[i].name) {
                    stuffToRender.push(myCurrentData[i]);
                }
            }
        }
        stuffToRender.sort((a, b) => a.zIndex - b.zIndex);
        finalRender(stuffToRender, paramCount, totalAvatars, selectedAvatar.localfile);
    };

    async function handleDrawAvatarClick() {
        window.nextRender = true;
        let myPets = await fillPetsData();
        let myBackgrounds = await fillBackgroundData();
        let myCurrentClass = await fillImageData();
        let myCurrentData = [...myPets, ...myBackgrounds, ...myCurrentClass];
        let totalAvatars = JSON.parse(localStorage.getItem("myAvatars")).length;
        let arcadianCount = 0;
        let avatarInterval = setInterval(() => {
            if (window.nextRender === true) {
                handleDrawAvatar(arcadianCount, myCurrentData, totalAvatars);
                arcadianCount += 1;
                if (arcadianCount >= totalAvatars) {
                    clearInterval(avatarInterval);
                }
            }
            window.nextRender = false;
        }, 1);
    }

    async function handleExportToCSV() {

        const downloadToFile = (content, filename, contentType) => {
            const a = document.createElement('a');
            const file = new Blob([content], {type: contentType});
            
            a.href= URL.createObjectURL(file);
            a.download = filename;
            a.click();
          
              URL.revokeObjectURL(a.href);
          };

        var csv = "";
        const header = "id\tpayload\n";
        csv += header;

        let avatarArray = JSON.parse(localStorage.getItem("myAvatars"));

        for (var i = 0; i < avatarArray.length; i++) {
            csv += (i+1) + "\t" + JSON.stringify(avatarArray[i].metadata) + "\n";
        }

        downloadToFile(csv, "avatars.csv", "text/plain");
    }

    return (
        <div style={{ paddingTop: 32, width: 740, margin: "auto", textAlign: "left" }}>
            <h3>How to Mint</h3>
            <div style={{ paddingBottom: 8 }}>
                <div style={{ paddingBottom: 8 }}>
                    <b>[1a]</b> Press
                    <span
                        className="highlight"
                        style={{ margin: 4, backgroundColor: "#f9f9f9", padding: 4, borderRadius: 4, fontWeight: "bolder" }}
                    >
                        📝 Initialize
                    </span>{" "}
                    to retrieve the config parameters from the ORA file, then edit the <b>json file</b> below with the desired
                    randomization parameters.
                </div>

                <div style={{ paddingBottom: 8 }}>
                    <b>[1b]</b> Alternatively, we can edit <b>STARTING_CONFIG_JSON</b> in AvatarMinter.jsx directly.
                </div>
            </div>
            <div style={{ paddingBottom: 16 }}>
                <span style={{ width: "100%" }}>
                    <Button style={{ marginRight: 8 }} onClick={handleClickInitConfigButton} size="large" shape="round">
                        <span style={{ marginRight: 8 }}>
                            <span role="img" aria-label="fuelpump">
                                📝
                            </span>
                        </span>
                        Initialize
                    </Button>
                </span>
            </div>

            <div style={{ padding: 8, height: "400px", overflowY: "auto" }}>
                <ReactJson
                    style={{ padding: 8 }}
                    src={mintingConfigJSON}
                    theme="pop"
                    name="Randomization Parameters"
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

            <div style={{ paddingBottom: 8 }}>
                <div style={{ paddingBottom: 8 }}>
                    <b>[2]</b> Once config.json above is initialized, press
                    <span
                        className="highlight"
                        style={{ margin: 4, backgroundColor: "#f9f9f9", padding: 4, borderRadius: 4, fontWeight: "bolder" }}
                    >
                        🎲 Generate
                    </span>{" "}
                    to start generating random avatars.
                </div>
            </div>

            <div style={{ paddingBottom: 16, paddingTop: 16 }}>
                <span style={{ width: "100%" }}>
                    <Button style={{ marginRight: 8 }} onClick={handleClickGenerateButton} size="large" shape="round">
                        <span style={{ marginRight: 8 }}>
                            <span role="img" aria-label="fuelpump">
                                🎲
                            </span>
                        </span>
                        Generate
                    </Button>
                </span>
            </div>

            <div style={{ paddingBottom: 16, paddingTop: 16 }}>
                <span style={{ width: "100%" }}>
                    <Button style={{ marginRight: 8 }} onClick={handleDrawAvatarClick} size="large" shape="round">
                        <span style={{ marginRight: 8 }}>
                            <span role="img" aria-label="fuelpump">
                                🎨
                            </span>
                        </span>
                        Draw
                    </Button>
                    <a id="currentdownload"></a>
                </span>
            </div>

            <div style={{ paddingBottom: 16, paddingTop: 16 }}>
                <span style={{ width: "100%" }}>
                    <Button style={{ marginRight: 8 }} onClick={handleExportToCSV} size="large" shape="round">
                        <span style={{ marginRight: 8 }}>
                            <span role="img" aria-label="fuelpump">
                                📊
                            </span>
                        </span>
                        Export to CSV
                    </Button>
                </span>
            </div>


            <div style={{ display: "flex", flexDirection: "row" }}>
                <ReactJson
                    style={{ padding: 8, height: "400px", overflowY: "auto" }}
                    src={metadataJson}
                    theme="pop"
                    enableClipboard={false}
                    collapsed={2}
                />
                <div>
                    <canvas className="Avatar-canvas" ref={canvasRef} width={canvasWidth} height={canvasHeight} />
                </div>
            </div>

            <div style={{ paddingBottom: 8 }}>
                <div style={{ paddingBottom: 8 }}>
                    <b>[3]</b> Press
                    <span
                        className="highlight"
                        style={{ margin: 4, backgroundColor: "#f9f9f9", padding: 4, borderRadius: 4, fontWeight: "bolder" }}
                    >
                        ⬆ Upload
                    </span>{" "}
                    to upload the images and metadata to IPFS. The resulting tokenURI will be shown below.
                </div>
            </div>

            <div style={{ paddingBottom: 16, paddingTop: 16 }}>
                <span style={{ width: "100%" }}>
                    <Button
                        style={{ marginRight: 8 }}
                        onClick={handleClickUploadButton}
                        loading={sending}
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
                </span>
            </div>

            <div style={{ padding: 8, height: "400px", overflowY: "auto" }}>
                <ReactJson
                    style={{ padding: 8 }}
                    src={uploadedTokenURI}
                    name="Metadata on IPFS"
                    theme="pop"
                    enableClipboard={false}
                    onEdit={false}
                    collapsed={2}
                />
            </div>

            <div style={{ padding: 16, paddingBottom: 30 }}>
                <a href={"https://ipfs.io/ipfs/" + ipfsHash} target="_blank">
                    IPFS Hash: {ipfsHash}
                </a>
            </div>

            <div style={{ paddingBottom: 8 }}>
                <div style={{ paddingBottom: 8 }}>
                    <b>[4] </b>
                    Once Upload is completed, press 📜 Set Base URI to update the contract URI.
                </div>
            </div>

            <div style={{ paddingBottom: 16, paddingTop: 16 }}>
                <span style={{ width: "100%" }}>
                    <Button
                        style={{ marginRight: 8 }}
                        onClick={() => callSetURI("https://ipfs.io/ipfs/" + ipfsHash + "/")}
                        loading={sending}
                        size="large"
                        shape="round"
                    >
                        <span style={{ marginRight: 8 }}>
                            <span role="img" aria-label="fuelpump">
                                📜
                            </span>
                        </span>
                        Set Base URI
                    </Button>
                </span>
            </div>

            <div style={{ paddingBottom: 8 }}>
                <div style={{ paddingBottom: 8 }}>
                    <b>[5] </b>
                    Finally, input the amount to mint below and press <BankOutlined />. Go to <b>MyCollectibles</b> to see your
                    NFTs!
                </div>
            </div>

            <div style={{ paddingBottom: 16, paddingTop: 16 }}>
                <span style={{ width: "100%" }}>
                    <Input
                        style={{ width: "100%", marginTop: 16, marginBottom: 150 }}
                        size="large"
                        placeholder={"amount to mint"}
                        onChange={e => {
                            setMintAmount(e.target.value);
                        }}
                        suffix={
                            <Tooltip title="Mint: Mint the specified quantity to current wallet.">
                                <Button onClick={() => callMintMultiple(parseInt(mintAmount))} shape="circle" icon={<BankOutlined />} />
                            </Tooltip>
                        }
                    />
                </span>
            </div>
        </div>
    );
}
