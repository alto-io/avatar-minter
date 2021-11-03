import { Button } from "antd";
import React, { useState, useEffect } from "react";

import { useAvatar } from "../hooks";

import ReactJson from "react-json-view";

import { Cascader } from "antd";
import { Row, Col } from "antd";

import { Tree } from "antd";
import { DownOutlined, FrownOutlined, SmileOutlined, MehOutlined, FrownFilled } from "@ant-design/icons";
import { data } from "autoprefixer";

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

var currentFile = {};

export default function AvatarViewer() {
    const [configJSON, setConfigJSON] = useState(STARTING_CONFIG_JSON);
    var [
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

    const [defaultText, setDefaultText] = useState({value: "Default"});

    function handleSelect(e) {

        let currentDrop = JSON.parse(e.target.value);
        let selectedItem = holdDataParts[currentDrop.main].children[currentDrop.child];
        let clue = selectedItem.parent.name.split(" ")[0];

        setDefaultText({value : e.target.value});

        for (let i = 0; i < dataParts.length; i++) {
            if (dataParts[i].name.includes(clue)) {
                selectedItem.get_base64().then(value => {
                    let index = selectedItem.parent.z_index;
                    if (selectedItem.parent.name.includes("Background") || selectedItem.parent.name.includes("background")) {
                        index = 0;
                    }
                    if (selectedItem.parent.name.includes("Head") || selectedItem.parent.name.includes("head")) {
                        index = 9;
                    }
                    if (selectedItem.parent.name.includes("Bottom") || selectedItem.parent.name.includes("bottom")) {
                        index = 10;
                    }
                    let currentObj = {
                        name: selectedItem.parent.name,
                        value: value,
                        zIndex: index,
                        color: dataParts[i].color,
                        key: selectedItem.parent.name,
                        title: selectedItem.parent.name,
                        type: "selected",
                        offsetX: selectedItem.attribs.offsets[0],
                        offsetY: selectedItem.attribs.offsets[1],
                    };
                    dataParts[i] = currentObj;
                    changeAvatarColor(dataParts);
                    return;
                });
            }
        }
    }

    function ConfigDiv(props) {
        useEffect(() => {
        }, [props.data]);
        return (
            <div>
                {props.data.map((item, index) => (
                    <div
                        key={index.toString()}
                        style={{
                            paddingBottom: "25px",
                        }}
                    >
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
                                    width: "100%",
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
                        </div>
                        <div
                            style={{
                                textAlign: "center",
                            }}
                        >
                            <select
                                onChange={handleSelect}
                                style={{
                                    width: "330px",
                                }}
                                value={defaultText.value}
                            >
                                {item.children.map((it, inx) => (
                                    <option
                                        value={"{" + '"main":' + index.toString() + ", " + '"child":' + inx.toString() + "}"}
                                        key={inx.toString()}
                                    >
                                        {it.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const handleClickNewAvatarButton = async event => {
        setNewAvatar(currentFile);
    };

    function changeItemColor(i, color, e) {
        dataParts[i].color = color;
        changeAvatarColor(dataParts);
    }

    function handleAvatarUpload(uploadEvent) {
        let file = uploadEvent.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = loadEvent => {
                currentFile = new Blob([loadEvent.target.result], { type: "application/octet-stream" });
                //reloadConfig(currentFile);
                getAvatar(currentFile);
            };
        }
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
                        <div>
                            <input type="file" onChange={handleAvatarUpload} multiple={false} />
                        </div>
                    </Col>
                </Row>
            </div>
            <div style={{ display: "flex", flexDirection: "row" }}>
                <div>
                    <canvas className="Avatar-canvas" ref={canvasRef} width={canvasWidth} height={canvasHeight} />
                </div>
                {/* <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350">
                    <style>
                        {`.Common { fill: white; font-family: serif; font-size: 14px; }
              .Rare { fill: deepskyblue; font-family: serif; font-size: 14px; }
              .Legendary { fill: orange; font-family: serif; font-size: 14px; }
            `}
                    </style>
                    <rect width="100%" height="100%" fill="black" />
                    {lootText.map((x, index) => {
                        return (
                            <text x={10} y={(index + 1) * 20} className={x.rarity} key={index.toString()}>
                                {x.name}
                            </text>
                        );
                    })}
                </svg> */}
                <div>
                    {
                    /*
                    infoDataParts.map((item, index) => (
                        <div
                            key={index.toString()}
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
                    ))
                    */
                    }
                </div>
                {
                /*
                <ConfigDiv data={holdDataParts}></ConfigDiv>
                */
                }
            </div>
        </div>
    );
}
