import { useRef, useEffect, useState } from "react";

/*
  ~ What it does? ~

  Loads the avatar images from public/avatars/avatarimages.ora
  Creates a new random avatar given certain parameters

  ~ How can I use? ~

  const avatarImage = useAvatar(); <- returns a random avatar with json info

  ~ Features ~

  - Coming Soon -

*/

export const canvasWidth = 400;
export const canvasHeight = 400;

const useAvatar = (props) => {

    // load jsora and lodash
    const jsora = window.jsora;
    const _ = window._;
    const project = new jsora.JSOra();
    var rend;

    const [randomConfig, setRandomConfig] = useState({ "Root": {} });
    const [mintingConfig, setMintingConfig] = useState(
        {
            "fileName": "config.json",
            "amountToMint": "10",
            "initialized": false
        }
    )
    const [partsList, setPartsList] = useState({ "PartsList": {} });

    const canvasRef = useRef(null);

    var tempPartsList = { "PartsList": {} }

    useEffect(() => {

        getAvatar();
    }, [props]);

    const loadProject = async () => {
        let loaded_file = await fetch(`avatars/AvatarImages.ora`).then(r => r.blob());
        await project.load(loaded_file);

    }

    const getAvatar = async () => {
            
        setRandomConfig({ "Root": {} });

        await loadProject();

        rend = new jsora.Renderer(project);

        // first time to retrieve default config from project 
        await getAvatarConfiguration(project);

        await randomizeHiddenParts();

        // // second time to retrieve new random parts
        await getAvatarConfiguration(project);

        await drawAvatar();
        
    };

    async function drawAvatar() {
        const canvasObj = canvasRef.current;
        const ctx = canvasObj.getContext('2d');
        var newCanvas = await renderAvatar();
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(newCanvas, 0, 0);

    }

    async function setNewAvatar() {
        await getAvatar();
        return randomConfig;
    }

    async function generateMetadataJson() {
        console.log(mintingConfig)
        if (mintingConfig.initialized)
        return {
            "1": "2"
        }
        else {
            return {
                "filename": "metadata.json"                
            }
        }
    }

    async function getMintingConfig() {
        await loadProject();

        await getAllPartsJson(project);

        var newConfig = _.merge(mintingConfig, tempPartsList);
        newConfig.initialized = true;

        setPartsList(tempPartsList);
        setMintingConfig(newConfig);
        return mintingConfig;
    }

    async function getAllPartsJson(project) {
           // extract avatar format from layers
           recurseOverParts(project, "PartsList");
    }

    function recurseOverParts(obj, parent) {
        for (let child of obj.children) {

            if (child.children != undefined) {
                recurseOverParts(child, parent + "." + child.name)
            } else {
                    addToPartsList(parent + "." + child.name);
            }
        }
    }

    function addToPartsList(partString) {
        var objectToAdd = recursivelyCreateNodes(partString.split(".").reverse());
        var partStringArray = partString.split(".");

        var partToAdd = { 
            "name": partStringArray[partStringArray.length - 1],
            "weight": 10 
            
            // weight is used to detemine chance to get.
            //
            // chance to get is determined by sum of all weights in a partCategory 
            // divided by a specific part's weight.
            // 
            // For example, if there are 5 parts in a partCategory and each part has a weight of 10
            // then all parts have an equal chance of being selected. 
            //
            // If one part has a weight of 20, and all others have a weight of 10, 
            // then that part has twice the chance of being selected from all the others.
            //
            // All part weights start as 10 for the initial configuration,
            // meaning they can all be selected equally.
        }

        var partCategory = partString.slice(0, partString.lastIndexOf("."));

        // check if object should be added to array
        var currentPartSet =_.get(tempPartsList, partCategory);
        if (currentPartSet == undefined) {
            currentPartSet = [partToAdd]
        }
        else {
            currentPartSet.push(partToAdd)
        }

        _.set(objectToAdd, partCategory, currentPartSet);

        tempPartsList = _.merge(tempPartsList, objectToAdd);
    }
    
    async function randomizeHiddenParts() {

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
        traverse(randomConfig, "");
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
        setRandomConfig(_.merge(randomConfig, objectToAdd));
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



    async function renderAvatar() {

        return await rend.make_merged_image(); // returns canvas

    }

    return [canvasRef, canvasWidth, canvasHeight, setNewAvatar, getMintingConfig, generateMetadataJson]
};

export default useAvatar;
