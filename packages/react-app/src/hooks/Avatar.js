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
    var randomConfig = { "Root": {} };

    const canvasRef = useRef(null);
    const [config, setConfig] = useState(null);

    useEffect(() => {

        getAvatar();
    }, [props]);

    const getAvatar = async () => {
            

        randomConfig = { "Root": {} };

        let loaded_file = await fetch(`avatars/AvatarImages.ora`).then(r => r.blob());
        await project.load(loaded_file);

        rend = new jsora.Renderer(project);

        // first time to retrieve default config from project 
        await getAvatarConfiguration(project);

        await randomizeHiddenParts();

        // second time to retrieve new random parts
        await getAvatarConfiguration(project);


        setConfig(randomConfig);

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

        getAvatar();
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
        randomConfig = _.merge(randomConfig, objectToAdd);
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

    return [config, canvasRef, canvasWidth, canvasHeight, setNewAvatar]
};

export default useAvatar;
