import { Button } from "antd";
import React from "react";

/*
  ~ What it does? ~

  Create your own Avatar NFTs!

  Processes an OpenRaster (.ora) file of generative avatars
  to upload generative avatars to IPFS and create a metadata
  json file usable for tokenUris.
  
  See packages/avatar/img/ for examples of .ora files.
  .ora files can be exported from PSD files via GIMP.

  ~ How can I use? ~

  <Avatar/>

  Server API:
  Copy the metadata json to packages/avatar/data/metadata.json

  ~ Features ~

  - Uses ERC-721
  - Define avatar specs easily
  - Assumes avatars are pre-minted for now
*/

export default function Avatar(props) {

    // load jsora and lodash
    const jsora = window.jsora;
    const _ = window._;

    var config = { "Root": {} }
    var project = new jsora.JSOra();

    initialize();

    async function initialize() {

        let loaded_file = await fetch(`avatars/AvatarImages.ora`).then(r => r.blob());
        await project.load(loaded_file);

        generateAvatar();
    }

    async function generateAvatar() {

        // generate new image from newConfig
        updateElementStates(true);

        // create a new random config
        await getRandomConfig();


        setTimeout(renderAvatar, 50);
    }

    // true == generating Avatar
    function updateElementStates(state) {
        if (state) {
            // remove any previous avatar canvases
            var oldCanvas = document.getElementById('avatar');

            if (oldCanvas != null) {
                oldCanvas.remove();
            }
        }
    }

    async function getRandomConfig() {

        await randomizeHiddenParts();
        console.log(config);

    }

    async function randomizeHiddenParts() {
        await getAvatarConfiguration(project);

        function traverse(jsonObj, parent) {
            if (jsonObj !== null && typeof jsonObj == "object") {
                Object.entries(jsonObj).forEach(([key, value]) => {
                    // key is either an array index or object key
                    var parentTrace = parent === "" ? key : parent + "/" + key
                    traverse(value, parentTrace);
                });
            }
            else {
                randomizePart(parent + "//" + jsonObj)
            }
        }
        traverse(config, "");
    }

    // TODO: We assume some layer properties and layer depth here.
    // we should remove these assumptions and encode part properties on layer name (is it nullable, etc)
    function randomizePart(partString) {
        var currentPart = partString.split("//")[1];
        var path = "/" + partString.split("Root/")[1].split("//")[0];
        var partType = path.split("/")[1];

        // get node in open-raster project
        var layer = project.get_by_path(path);

        // accessories are optional
        var isAccessory = partType === "Accessories";

        // if accessory, last option means no accessory is chosen
        var totalOptions = isAccessory ? layer.children.length + 1 : layer.children.length

        // randomize a number
        var randomPartIndex = Math.floor(Math.random() * totalOptions);

        // hide all parts
        for (var child of layer.children) {
            child.hidden = true;
        }

        // unhide one part (with accessory check)
        if (randomPartIndex != layer.children.length) {
            layer.children[randomPartIndex].hidden = false;
        }
    }

    async function renderAvatar() {

        const rend = new jsora.Renderer(project);

        var rendered = await rend.make_merged_image(); // returns canvas
        rendered.id = "avatar"

        document.body.appendChild(rendered);
        updateElementStates(false)
    }

    async function getAvatarConfiguration(project) {

        // extract avatar format from layers
        recurseOverChildren(project, "Root");
    }

    function recurseOverChildren(obj, parent) {
        for (let child of obj.children) {

            if (child.children != undefined) {
                recurseOverChildren(child, parent + "." + child.name)
            } else {
                if (!child.hidden) {
                    addToConfig(parent + "." + child.name);
                }
            }
        }
    }

    function addToConfig(partString) {
        var objectToAdd = recursivelyCreateNodes(partString.split(".").reverse());
        config = _.merge(config, objectToAdd);
    }

    function recursivelyCreateNodes(partArray) {
        if (partArray.length <= 1) {
            return partArray[0];
        }
        else {
            var node = {};
            var nodeName = partArray.pop();
            node[nodeName] = recursivelyCreateNodes(partArray);
            return node;
        }
    }

    return (
        <div style={{ paddingTop: 32, width: 740, margin: "auto", textAlign: "left" }}>

            <canvas id="avatar"></canvas>
            <Button
                onClick={() => {
                    window.open("https://ethgasstation.info/");
                }}
                size="large"
                shape="round"
            >
                <span style={{ marginRight: 8 }}>
                    <span role="img" aria-label="fuelpump">
                        ⛽️
                    </span>
                </span>
                {typeof props.gasPrice === "undefined" ? 0 : parseInt(props.gasPrice, 10) / 10 ** 9}g
            </Button>

        </div>
    );
}
