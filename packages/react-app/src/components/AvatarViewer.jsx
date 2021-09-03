import { Button } from "antd";
import React, { useState } from "react";

import { useAvatar } from "../hooks";

import ReactJson from "react-json-view";

import { Cascader } from "antd";
import { Row, Col } from "antd";

import { Tree } from "antd";
import { DownOutlined, FrownOutlined, SmileOutlined, MehOutlined, FrownFilled } from "@ant-design/icons";

const TreeNode = Tree.TreeNode;

/*
  ~ What it does? ~

  Randomly generate Avatars and view minted ones from the API!

  Processes an OpenRaster (.ora) file of generative avatars
  to upload generative avatars to IPFS and create a metadata
  json file usable for tokenUris.
  
  See public/avatars/avatarimages.ora for examples of .ora files.
  .ora files can be opened and exported from PSD files via GIMP.

  ~ How can I use? ~

  Put your .ora file in public/avatars/avatarimages.ora

  Client Side:
  <AvatarViewer/>

  Server Side:
  Copy the metadata json to packages/avatar/data/metadata.json

  ~ Features ~

  - easily view random avatars
  - Define avatar specs easily
  - Assumes avatars are pre-minted for now
*/

const STARTING_CONFIG_JSON = {
    "Getting Started":
        "Select a class then Press ( 😀 New Avatar )! this JSON view will contain the avatar's parts options.",
};

export default function AvatarViewer() {
    const [configJSON, setConfigJSON] = useState(STARTING_CONFIG_JSON);
    const [
        canvasRef,
        dataParts,
        infoDataParts,
        setInfoDataParts,
        changeAvatarColor,
        canvasWidth,
        canvasHeight,
        setNewAvatar,
        getMintingConfig,
        generateMetadataJson,
        setMintingConfig,
        metadataJson,
        uploadedTokenURI,
        startIPFSUpload,
        ipfsHash,
        classOptions,
        setSelectedClass,
        selectedClass,
        configTree,
        setConfigTree,
    ] = useAvatar();

    const handleClickNewAvatarButton = async event => {
        setNewAvatar();
        // setConfigJSON(await setNewAvatar());
        // setConfigTree([]);
        console.log(infoDataParts, "-------------------------------------");
        console.log(configTree, "-------------------------------------");
    };

    function changeItemColor(i, color, e) {
        //console.log(e);
        dataParts[i].color = color;
        //setInfoDataParts(dataParts);
        changeAvatarColor(dataParts);
    }

    function handleChange(value) {
        setSelectedClass(value);
    }
    return (
        <div style={{ paddingTop: 32, width: 740, margin: "auto", textAlign: "left" }}>
            <div>
                <Row style={{ margin: 8 }}>
                    <Col span={12}>
                        <Cascader
                            style={{ width: 300 }}
                            options={classOptions}
                            onChange={handleChange}
                            placeholder="Select Class"
                        ></Cascader>
                    </Col>
                    <Col span={6}>
                        <Button onClick={handleClickNewAvatarButton} disabled={selectedClass.length == 0}>
                            <span style={{ marginRight: 8 }}>
                                <span role="img" aria-label="fuelpump">
                                    😀
                                </span>
                            </span>
                            New Avatar
                        </Button>
                    </Col>
                </Row>
            </div>

            <div style={{ display: "flex", "flex-direction": "row" }}>
                <div>
                    <canvas className="Avatar-canvas" ref={canvasRef} width={canvasWidth} height={canvasHeight} />
                </div>
                {/*
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
                */}

                {/*  <Tree
                    style={{ padding: 8, border: "2px solid #888888" }}
                    showIcon
                    defaultSelectedKeys={['0-0-0']}
                    switcherIcon={<DownOutlined />}
                    treeData={configTree}
                >
                </Tree> */}
                {/*                 <Tree
                    style={{ padding: 8, border: "2px solid #888888" }}
                    showIcon
                    defaultSelectedKeys={['0-0-0']}
                    switcherIcon={<DownOutlined />}
                    treeData={infoDataParts}
                >
                    
                </Tree> */}
                <div>
                    {infoDataParts.map((item, index) => (
                        <div
                            style={{
                                width: "350px",
                                height: "50px",
                                display: "flex",
                                justifyContent: "space-around",
                                alignItems: "stretch",
                            }}
                        >
                            <div
                                style={{
                                    width: "60%",
                                    height: "80%",
                                    border: "rgb(217, 217, 217) 1px solid",
                                    borderRadius: "4px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    margin: "4px",
                                }}
                            >
                                <div>{item.name}</div>
                            </div>
                            <div
                                style={{
                                    width: "20%",
                                    height: "80%",
                                    border: "rgb(217, 217, 217) 1px solid",
                                    borderRadius: "4px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    margin: "4px",
                                }}
                            >
                                <div>{item.color}</div>
                            </div>
                            <div
                                style={{
                                    width: "20%",
                                    height: "80%",
                                    border: "rgb(217, 217, 217) 1px solid",
                                    borderRadius: "4px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    margin: "4px",
                                }}
                            >
                                <div>
                                    <input
                                        type="color"
                                        value={item.color}
                                        onChange={e => changeItemColor(index, e.target.value, item)}
                                        style={{
                                            width: "50px",
                                            height: "25px",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
