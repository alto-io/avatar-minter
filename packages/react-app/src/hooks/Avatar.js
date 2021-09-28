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
const ipfsAPI = require("ipfs-http-client");
const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });
const all = require("it-all");

var dataParts = [];
var tempLootText = [];
var colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF", "#FFA500", "#FF69B4", "#DAA520", "#B22222", "#F0FFF0", "#C0C0C0", "#00FF00", "#808000", "#FF6347"];

const useAvatar = props => {
    // load jsora and lodash
    const jsora = window.jsora;
    const _ = window._;
    const project = new jsora.JSOra();
    var rend;

    const [randomConfig, setRandomConfig] = useState({ Root: {} });
    const [mintingConfig, setMintingConfig] = useState({
        amountToCreate: 2,
        description: "An avatar for the open metaverse!",
        external_url: "https://kernel.community/en/track-gaming/module-1",
        initialized: false,
    });
    const [partsList, setPartsList] = useState({ PartsList: {} });

    const [lootText, setLootText] = useState([])

    const [metadataJson, setMetadataJson] = useState({ tokenMetadata: {} });

    const [uploadedTokenURI, setUploadedTokenURI] = useState({ tokenURI: {} });

    const [ipfsHash, setIpfsHash] = useState();

    const canvasRef = useRef(null);

    const [infoDataParts, setInfoDataParts] = useState([]);
    const [holdDataParts, setHoldDataParts] = useState([]);

    var tempPartsList = { PartsList: {} };

    var requiredPartsList = [];

    const [classOptions, setClassOptions] = useState([]);
    const [selectedClass, setSelectedClass] = useState([]);
    const [configTree, setConfigTree] = useState([]);

    var currentRandomConfig = {};
    var currentTreeConfig = [];

    useEffect(() => {
        if (selectedClass.length <= 0) {
            getAvatar();
        }
        else {
            reloadConfig();
        }
    }, [selectedClass]);

    useEffect(() => {
        updateTreeData();
    }, [randomConfig]);


    const updateTreeData = async () => {
        if (randomConfig.children !== undefined) {
            var children = Array.from(randomConfig);
            setConfigTree(children);
        }
    }

    const loadProject = async (fileLocation) => {
        if (fileLocation instanceof Blob === false) {
            console.log("Loading default file");
            let loaded_file = await fetch(`avatars/AvatarImages.ora`).then(r => r.blob());
            await project.load(loaded_file);
        }
        else {
            console.log("Loading specified file");
            await project.load(fileLocation);
        }
    };

    async function drawAvatarFromMetadata(metadata, index, amountToCreate) {
        setRandomConfig({ Root: {} });

        // unhide project layers according to metadata
        await refreshProjectLayers(project, metadata);

        const ipfsHash = await drawMiniAvatar(index + 1, amountToCreate, true);

        return ipfsHash;
    }

    async function refreshProjectLayers(project, metadata) {
        recurseOverMetadata(project, "Root", metadata);
    }

    function recurseOverMetadata(obj, parent, metadata) {
        for (let child of obj.children) {
            var fullName = parent + "." + child.name;

            if (child.children != undefined) {
                recurseOverMetadata(child, fullName, metadata);
            } else {
                // unhide layers specified in metadata
                if (_.get(metadata, parent) == child.name) {
                    child.hidden = false;
                } else {
                    child.hidden = true;
                }
            }
        }
    }

    const startIPFSUpload = async () => {
        console.log("startIPFS");
        await loadProject();
        rend = new jsora.Renderer(project);

        const canvasObj = canvasRef.current;
        const ctx = canvasObj.getContext("2d");
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        var tokenMetadata = metadataJson.tokenMetadata;

        var files = [];
        var tokenURIArray = [];

        const IMAGE_BASE_URI = "https://ipfs.io/ipfs/";
        const NAME_BASE = "Avatar ";

        // redraw avatar from metadata json
        for (var i = 0; i < tokenMetadata.length; i++) {
            var ipfsHash = await drawAvatarFromMetadata(tokenMetadata[i], i, tokenMetadata.length);

            // move token metadata to attributes (for opensea)
            var attrib = tokenMetadata[i].Root;

            // generate the token URI
            var tokenURI = {
                name: NAME_BASE + (i + 1),
                description: mintingConfig.description,
                external_url: mintingConfig.external_url,
                image: IMAGE_BASE_URI + ipfsHash,
                attributes: attrib,
            };

            tokenURIArray.push(tokenURI);

            var tempTokenURI = {
                tokenURI: tokenURIArray,
            };

            setUploadedTokenURI(tempTokenURI);

            files.push({
                path: "/tmp/" + (i + 1),
                content: JSON.stringify(tokenURI),
            });
        }

        const cid = (await all(ipfs.addAll(files))).pop().cid.string;

        setIpfsHash(cid);
    };

    const reloadConfig = async (reloadParam) => {
        console.log("reloadConfig", reloadParam);
        await loadProject(reloadParam);
        await getAvatarConfiguration(project);
        setRandomConfig(currentRandomConfig);
    }

    const getAvatar = async (getParam) => {
        currentRandomConfig = { Root: {} };

        console.log("getAvatar", getParam);
        await loadProject(getParam);
        await getBaseClasses();  // reinits

        rend = new jsora.Renderer(project);
        await getAvatarConfiguration(project);
        await hideLayersRecursively(project, "Root");
        await randomizeHiddenParts();
        setRandomConfig(currentRandomConfig);
        await drawAvatar();

        setLootText(tempLootText);
    };

    function getBaseClasses() {
        var tempBaseClassArray = [];

        for (let child of project.children) {
            if (child.name.includes("CLASS")) {
                var classOption = {
                    name: child.name,
                    children: getBaseClassesRecursively(child)
                }
                tempBaseClassArray.push(classOption);
            }
        }

        refreshClassOptions(tempBaseClassArray);
    }

    function getBaseClassesRecursively(obj) {
        var tempBaseClassArray = [];

        for (let child of obj.children) {
            if (child.name.includes("CLASS")) {
                var classOption = {
                    name: child.name,
                    children: getBaseClassesRecursively(child)
                }
                tempBaseClassArray.push(classOption);
            }
        }

        return tempBaseClassArray;
    }

    function hideLayersRecursively(obj, parent) {
        for (let child of obj.children) {
            child.hidden = !child.name.includes("UNIVERSAL");

            if (child.children != undefined) {
                hideLayersRecursively(child, parent + "." + child.name);
            }
        }
    }


    function changeAvatarColor(paramArray) {
        const canvas1 = canvasRef.current;
        const ctx1 = canvas1.getContext("2d");
        var newCanvas = { width: 400, height: 400 };

        ctx1.clearRect(0, 0, newCanvas.width, newCanvas.height);
        paramArray.sort((a, b) => a.zIndex - b.zIndex);
        setInfoDataParts([...paramArray]);
        for (let i = 0; i < paramArray.length; i++) {
            let currentImg = new Image(newCanvas.width, newCanvas.height);
            currentImg.src = paramArray[i].value;
            currentImg.onload = function () {
                const currentCanvas = document.createElement('canvas');
                currentCanvas.setAttribute("id", "currentCanvas" + i.toString());
                const currentContext = currentCanvas.getContext("2d");
                currentCanvas.width = newCanvas.width;
                currentCanvas.height = newCanvas.height;
                currentContext.clearRect(0, 0, newCanvas.width, newCanvas.height);
                if (paramArray[i].type === "selected") {
                    currentContext.drawImage(currentImg, paramArray[i].offsetX, paramArray[i].offsetY);
                }
                else {
                    currentContext.drawImage(currentImg, 0, 0);
                }

                currentContext.globalCompositeOperation = "source-atop";
                currentContext.fillStyle = paramArray[i].color;

                currentContext.fillRect(0, 0, newCanvas.width, newCanvas.height);
                currentContext.globalCompositeOperation = "source-over";

                ctx1.globalCompositeOperation = "source-over";
                if (paramArray[i].type === "selected") {
                    ctx1.drawImage(currentImg, paramArray[i].offsetX, paramArray[i].offsetY);
                }
                else {
                    ctx1.drawImage(currentImg, 0, 0);
                }

                ctx1.globalCompositeOperation = "color";
                ctx1.drawImage(currentCanvas, 0, 0);

                currentCanvas.remove();
            }
        }
    }


    async function drawAvatar() {
        const canvas1 = canvasRef.current;
        const ctx1 = canvas1.getContext("2d");
        var newCanvas = await renderAvatar();
        ctx1.clearRect(0, 0, newCanvas.width, newCanvas.height);

        //ctx1.drawImage(newCanvas, 0, 0);


        dataParts.sort((a, b) => a.zIndex - b.zIndex);
        for (let i = 0; i < dataParts.length; i++) {
            let currentImg = new Image(newCanvas.width, newCanvas.height);
            currentImg.src = dataParts[i].value;
            currentImg.onload = function () {
                const currentCanvas = document.createElement('canvas');
                currentCanvas.setAttribute("id", "currentCanvas" + i.toString());
                const currentContext = currentCanvas.getContext("2d");
                currentCanvas.width = newCanvas.width;
                currentCanvas.height = newCanvas.height;
                currentContext.clearRect(0, 0, newCanvas.width, newCanvas.height);
                currentContext.drawImage(currentImg, 0, 0);
                currentContext.globalCompositeOperation = "source-atop";
                currentContext.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                dataParts[i].color = currentContext.fillStyle;
                setInfoDataParts([...dataParts]);

                currentContext.fillRect(0, 0, newCanvas.width, newCanvas.height);
                currentContext.globalCompositeOperation = "source-over";

                ctx1.globalCompositeOperation = "source-over";
                ctx1.drawImage(currentImg, 0, 0);
                ctx1.globalCompositeOperation = "color";
                ctx1.drawImage(currentCanvas, 0, 0);

                currentCanvas.remove();
            }
        }

    }

    async function setNewAvatar(newParam) {
        dataParts.length = 0;
        await getAvatar(newParam);
        return randomConfig;
    }

    function toBlobWrapper(canvas) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                async blob => {
                    var result = await ipfs.add(blob);
                    resolve(result);
                },
                errorResponse => {
                    reject(errorResponse);
                },
            );
        });
    }

    async function drawMiniAvatar(i, amountToCreate, uploadToIPFS) {
        const canvasObj = canvasRef.current;
        const ctx = canvasObj.getContext("2d");
        const MAX_PER_ROW = Math.ceil(Math.sqrt(amountToCreate));

        var index = i - 1;
        var TOTAL_ROWS = amountToCreate / MAX_PER_ROW;
        var x = index % MAX_PER_ROW;
        var y = Math.floor(index / MAX_PER_ROW);
        var width = canvasWidth / MAX_PER_ROW;
        var height = canvasHeight / TOTAL_ROWS;

        var dx = x * width;
        var dy = y * height;

        // console.log(index + "," + x + ", " + y + "," + dx + ", " + dy + ", " + width + ", " + height);

        var newCanvas = await renderAvatar();

        if (uploadToIPFS) {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.drawImage(newCanvas, 0, 0, canvasWidth, canvasHeight);

            const result = await toBlobWrapper(newCanvas);

            if (result && result.path) {
                return result.path;
            }
        } else {
            ctx.drawImage(newCanvas, 0, 0, canvasWidth, canvasHeight, dx, dy, width, height);

            return null;
        }
    }

    async function getNewAvatarMetadata() {
        // await randomizeHiddenParts();
        // await getAvatarConfiguration(project);

        var randomClass = getRandomClasses();

        setRandomConfig({ Root: {} });
        // setRandomConfig({ Root: {} });
        await getAvatarConfiguration(project, randomClass);
        await hideLayersRecursively(project, "Root");
        await randomizeHiddenParts(selectedClass);

        setRandomConfig(currentRandomConfig);

    }

    async function generateMetadataJson(mintingConfigJSON) {
        if (mintingConfigJSON.initialized) {
            var amountToCreate = mintingConfigJSON.amountToCreate;
            var mintArray = [];

            console.log("generateMetadaJson");
            await loadProject();
            await getBaseClasses();
            await getAvatarConfiguration(project);
            rend = new jsora.Renderer(project);

            const canvasObj = canvasRef.current;
            const ctx = canvasObj.getContext("2d");
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            for (var i = 1; i <= amountToCreate; i++) {
                await getNewAvatarMetadata();
                mintArray.push(JSON.parse(JSON.stringify(currentRandomConfig)));
                await drawMiniAvatar(i, amountToCreate, false);

                var tempMetadataJson = {
                    tokenMetadata: mintArray,
                };

                setMetadataJson(tempMetadataJson);
            }

            // console.log(mintArray);

            return tempMetadataJson;
        } else {
            return {
                filename: "metadata.json",
            };
        }
    }

    async function getMintingConfig() {
        console.log("getMintingConfig");
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
                recurseOverParts(child, parent + "." + child.name);
            } else {
                addToPartsList(parent + "." + child.name);
            }
        }
    }

    function addToPartsList(partString) {
        var objectToAdd = recursivelyCreateNodes(partString.split(".").reverse());
        var partStringArray = partString.split(".");

        var partToAdd = {
            name: partStringArray[partStringArray.length - 1],
            weight: 10,

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
        };

        var partCategory = partString.slice(0, partString.lastIndexOf("."));

        // check if object should be added to array
        var currentPartSet = _.get(tempPartsList, partCategory);
        if (currentPartSet == undefined) {
            currentPartSet = [partToAdd];
        } else {
            currentPartSet.push(partToAdd);
        }

        _.set(objectToAdd, partCategory, currentPartSet);

        tempPartsList = _.merge(tempPartsList, objectToAdd);
    }

    async function randomizeHiddenParts() {
        requiredPartsList = [];
        tempLootText = [];

        function traverse(jsonObj, parent, hideAll) {
            if (jsonObj !== null && typeof jsonObj == "object") {
                Object.entries(jsonObj).forEach(([key, value]) => {
                    // key is either an array index or object key
                    var parentTrace = parent === "" ? key : parent + "/" + key;

                    if (key != "Root") {
                        findPartFromProject(key).hidden = false;
                    }

                    traverse(value, parentTrace, hideAll);
                });
            } else {
                // if layer name includes OPTIONAL_%, do a randomization
                var optional_percent = 1.1;

                if (parent.includes("OPTIONAL")) {
                    var i = parent.lastIndexOf("OPTIONAL_") + "OPTIONAL_".length;
                    var j = parent.lastIndexOf("%") + 1;
                    optional_percent = parseFloat(parent.substring(i, j)) / 100.0;
                }

                if (Math.random() >= optional_percent) {
                    project.get_by_path(parent.split("Root/Root")[1] + "/" + jsonObj).hidden = true;
                } else {
                    randomizePart(parent + "//" + jsonObj, hideAll);
                }
            }
        }

        traverse(randomConfig, "Root", false);

        // Object.entries(randomConfig.Root).forEach(([key, value]) => {
        //     var path = "Root/" + key;
        //     var hideAll = true;

        //     if (key === baseClass) {
        //         hideAll = false;

        //     }

        //     if (!key.includes("IGNORE")) {
        //         traverse(value, path, hideAll);
        //         project.get_by_path("/" + key).hidden = (hideAll && !key.includes("UNIVERSAL"));
        //     }
        // });
    }

    var hold = [];
    function getAllItems(param) {
        for (let i = 0; i < param.length; i++) {
            if (param[i].children !== undefined && param[i].children.length !== 0) {
                getAllItems(param[i].children);
            }
            else {
                if (hold.indexOf(param[i].parent) === -1 && param[i].parent.name.includes("CLASS") === false) {
                    hold.push(param[i].parent);
                }

            }
        }
    }

    function randomizePart(partString, hideAll) {
        // var currentPart = partString.split("//")[1];

        hold.length = 0;
        getAllItems(project.children);
        setHoldDataParts([...hold]);

        var currentPart = partString.split("//")[1];
        var path = partString.split("Root/Root")[1].split("//")[0];
        var partType = path.split("/")[1];

        // get node in open-raster project
        var layer = project.get_by_path(path);

        var index;

        const layer_base64 = project
            .get_by_path(path)
            .get_base64()
            .then(value => {
                index = project.get_by_path(path).z_index;
                if (project.get_by_path(path).name.includes("Background") ||
                    project.get_by_path(path).name.includes("background")) {
                    index = 0;
                }
                if (project.get_by_path(path).name.includes("Head") ||
                    project.get_by_path(path).name.includes("head")) {
                    index = 9;
                }
                if (project.get_by_path(path).name.includes("Bottom") ||
                    project.get_by_path(path).name.includes("bottom")) {
                    index = 10;
                }
                let currentObj = {
                    name: project.get_by_path(path).name,
                    value: value,
                    zIndex: index,
                    color: "Loading...",
                    key: project.get_by_path(path).name,
                    title: project.get_by_path(path).name,
                    type: "default"
                };
                dataParts.push(currentObj);
            });



        var totalOptions = layer.children.length;

        // randomize a number
        var randomPartIndex = Math.floor(Math.random() * totalOptions);

        // hide all parts
        for (var child of layer.children) {
            child.hidden = true;
        }

        // if a part is part of required list, unhide it and exit function
        for (var child of layer.children) {
            if (requiredPartsList.includes(child.name)) {
                child.hidden = false;
                return;
            }
        }

        // don't show a part if hideAll is true, unless layer is UNIVERSAL
        if (hideAll && !partString.includes("UNIVERSAL")) {
            return;
        }

        // unhide one part (with accessory check)
        if (randomPartIndex != layer.children.length) {
            // console.log( layer.children[randomPartIndex].name)
            layer.children[randomPartIndex].hidden = false;

            // check if the part requires other parts unhidden
            checkRequiredParts(layer.children[randomPartIndex].name);

            if (tempLootText.length < 5) {
                var modifier = "";
                var rarity = "Common";
                if (Math.random() < 0.3) {
                    rarity = "Rare";
                    modifier = "Shiny ";
                    if (Math.random() < 0.3) {
                        rarity = "Legendary";
                        modifier = "Mythical "
                    }

                }

                var lootObj = {
                    name: modifier + layer.children[randomPartIndex].name,
                    rarity
                }

                tempLootText.push(lootObj)
            }
        }
    }

    function checkRequiredParts(partString) {
        var splitStringArray = partString.split(" ");

        for (var i = 0; i < splitStringArray.length; i++) {
            if (splitStringArray[i] === "REQUIRES") {
                var requiredPart = splitStringArray[i + 1];

                // save required parts parent so they can be overridden
                requiredPartsList.push(requiredPart);

                i++;
            }
        }
    }

    function findPartFromProject(partName) {
        return recursivelyFindPart(project, "Root", partName);
    }

    function recursivelyFindPart(obj, parent, partName) {
        var node = undefined;

        for (let child of obj.children) {
            if (child.name === partName) {
                return child;
            }

            if (child.children != undefined) {
                node = recursivelyFindPart(child, parent + "." + child.name, partName);

                if (node != undefined) {
                    return node;
                }
            } else {
                if (child.name === partName) {
                    return child;
                }
            }
        }
    }

    async function getAvatarConfiguration(project, forcedClass) {
        recurseOverChildren(project, "Root", forcedClass);
        setConfigTree(currentTreeConfig);
    }

    function getRandomClasses() {
        var returnArray = []

        if (classOptions.length > 0) {
            var index = Math.floor(Math.random() * classOptions.length);
            var selectedClass = classOptions[index];
            returnArray.push(selectedClass.value);

            while (selectedClass.children != null) {
                index = Math.floor(Math.random() * selectedClass.children.length);
                returnArray.push(selectedClass.children[index].value);
                selectedClass = selectedClass.children[index];
            }

        }

        return returnArray;
    }

    function refreshClassOptions(classArray) {
        var returnArray = [];
        for (var i = 0; i < classArray.length; i++) {
            returnArray.push(
                {
                    value: classArray[i].name,
                    label: classArray[i].name,
                    children: refreshClassOptionsRecursively(classArray[i].children)
                })
        }

        setClassOptions(returnArray);
    }

    function refreshClassOptionsRecursively(childArray) {
        var returnArray = []

        for (var i = 0; i < childArray.length; i++) {
            returnArray.push(
                {
                    value: childArray[i].name,
                    label: childArray[i].name,
                    children: refreshClassOptionsRecursively(childArray[i].children)
                })
        }

        if (returnArray.length == 0) return null

        return returnArray;
    }

    function recurseOverChildren(obj, parent, forcedClass) {
        for (let child of obj.children) {
            if (child.name === "IGNORE") {
                continue;
            }

            if (forcedClass != null) {
                if (child.name.includes("CLASS") && !forcedClass.includes(child.name)) {
                    continue;
                }
            }

            else if (child.name.includes("CLASS") && !selectedClass.includes(child.name)) {
                continue;
            }

            if (child.children != undefined) {
                recurseOverChildren(child, parent + "." + child.name, forcedClass);
            } else {
                addToConfig(parent + "." + child.name);
                addToTreeConfig(parent + "." + child.name);
            }
        }
    }

    function addToConfig(partString) {
        var objectToAdd = recursivelyCreateNodes(partString.split(".").reverse());
        currentRandomConfig = _.merge(currentRandomConfig, objectToAdd);
    }

    function addToTreeConfig(partString) {
        var nodeArray = partString.split(".").reverse();
        nodeArray.pop();

        var objectToAdd = recursivelyCreateTreeNode([...nodeArray]);
        addObjectToTree(objectToAdd);
    }

    function recursivelyCreateTreeNode(nodeArray) {
        if (nodeArray.length <= 1) {
            return {
                key: nodeArray[0],
                title: nodeArray[0]
            }
        } else {
            var node = {};
            var nodeName = nodeArray.pop();
            node.key = nodeName;
            node.title = nodeName;
            node.children = [];
            node.children.push(recursivelyCreateTreeNode(nodeArray));
            return node;
        }
    }

    function addObjectToTree(objectToAdd) {
        // console.log(objectToAdd);
        // console.log(JSON.stringify(currentTreeConfig));
        var childArray = currentTreeConfig;
        var nodeToAdd = objectToAdd;
        var selectedNode = null;
        var finished = false;

        while (!finished) {
            selectedNode = null;
            var nodeName = nodeToAdd.key;
            // console.log(nodeName);

            // check if node already exists
            for (const node of childArray) {

                // console.log(node.key);

                if (node.key === nodeName) {
                    selectedNode = node;
                    break;
                }
            }

            // console.log(selectedNode);

            // if node was not found, create a new one
            if (selectedNode == null) {
                // console.log(childArray);
                var node = {};
                node.key = nodeName;
                node.title = nodeName;
                node.children = [];
                childArray.push(node);
                childArray = node.children;
            }

            // if node was found
            else {
                childArray = selectedNode.children;
            }

            if (nodeToAdd.children === undefined) {
                finished = true;

            }
            else {
                nodeToAdd = nodeToAdd.children[0];
            }
        }
    }

    function recursivelyCreateNodes(partArray) {
        if (partArray.length <= 1) {
            return partArray[0];
        } else {
            var node = {};
            var nodeName = partArray.pop();
            node[nodeName] = recursivelyCreateNodes(partArray);
            return node;
        }
    }

    async function renderAvatar() {
        return await rend.make_merged_image(); // returns canvas
    }

    return [
        canvasRef,
        dataParts,
        loadProject,
        reloadConfig,
        getAvatar,
        infoDataParts,
        setInfoDataParts,
        holdDataParts,
        setHoldDataParts,
        project,
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
        lootText
    ];
};

export default useAvatar;
