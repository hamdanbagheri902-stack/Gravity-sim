// =====================================================
// CHECK THREE.JS
// =====================================================

const statusText =
    document.getElementById("status");


if (typeof THREE === "undefined")
{
    statusText.innerHTML =
        "ERROR: Three.js did not load.<br>" +
        "Make sure your internet is connected.";

    throw new Error(
        "Three.js failed to load"
    );
}


// =====================================================
// SETTINGS
// =====================================================

const PARTICLE_COUNT = 50000;

const MAX_RADIUS = 15.0;

const POINT_SIZE = 0.095;


// =====================================================
// SCENE
// =====================================================

const scene =
    new THREE.Scene();


scene.background =
    new THREE.Color(
        0x000000
    );


// =====================================================
// CAMERA
// =====================================================

const camera =
    new THREE.PerspectiveCamera(
        50,

        window.innerWidth /
        window.innerHeight,

        0.1,
        1000
    );


let cameraDistance = 34;

let cameraYaw = 0.7;

let cameraPitch = 0.25;


// =====================================================
// RENDERER
// =====================================================

const renderer =
    new THREE.WebGLRenderer({
        antialias: true
    });


renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio,
        2
    )
);


renderer.setSize(
    window.innerWidth,
    window.innerHeight
);


document.body.appendChild(
    renderer.domElement
);


// =====================================================
// ROOT GROUP
// =====================================================

const atom =
    new THREE.Group();


scene.add(atom);


// =====================================================
// RANDOM
// =====================================================

function random(min, max)
{
    return (
        min +
        Math.random() *
        (max - min)
    );
}


// =====================================================
// RANDOM POINT INSIDE SPHERE
// =====================================================

function randomSpherePoint()
{
    while (true)
    {
        const x =
            random(
                -MAX_RADIUS,
                MAX_RADIUS
            );

        const y =
            random(
                -MAX_RADIUS,
                MAX_RADIUS
            );

        const z =
            random(
                -MAX_RADIUS,
                MAX_RADIUS
            );


        const r2 =
            x * x +
            y * y +
            z * z;


        if (
            r2 <=
            MAX_RADIUS *
            MAX_RADIUS
        )
        {
            return {
                x: x,
                y: y,
                z: z
            };
        }
    }
}


// =====================================================
// DZ² ORBITAL PROBABILITY
//
// Angular:
//
// (3 cos²(theta) - 1)²
//
// This creates:
//
//        TOP LOBE
//
//          ||
//
//     ========
//       RING
//     ========
//
//          ||
//
//       BOTTOM LOBE
// =====================================================

function orbitalProbability(
    x,
    y,
    z
)
{
    const r =
        Math.sqrt(
            x * x +
            y * y +
            z * z
        );


    if (r < 0.001)
    {
        return 0;
    }


    // Y is the vertical axis.

    const cosTheta =
        y / r;


    let angular =
        3.0 *
        cosTheta *
        cosTheta
        -
        1.0;


    angular *= angular;


    // Radial probability shape.

    const radial =
        r *
        r *
        Math.exp(
            -r * 0.52
        );


    return (
        angular *
        radial
    );
}


// =====================================================
// COLOR FROM DENSITY
// =====================================================

function setParticleColor(
    colors,
    index,
    density
)
{
    let r;
    let g;
    let b;


    // WHITE

    if (density > 0.75)
    {
        r = 1.0;
        g = 1.0;
        b = 0.9;
    }

    // YELLOW / ORANGE

    else if (density > 0.48)
    {
        r = 1.0;
        g = 0.65;
        b = 0.05;
    }

    // PINK

    else if (density > 0.23)
    {
        r = 1.0;
        g = 0.05;
        b = 0.45;
    }

    // PURPLE

    else
    {
        r = 0.38;
        g = 0.01;
        b = 1.0;
    }


    colors[index] =
        r;

    colors[index + 1] =
        g;

    colors[index + 2] =
        b;
}


// =====================================================
// PARTICLE CLOUD
// =====================================================

let orbitalCloud = null;


function createOrbital()
{
    if (orbitalCloud !== null)
    {
        atom.remove(
            orbitalCloud
        );


        orbitalCloud.geometry.dispose();

        orbitalCloud.material.dispose();
    }


    statusText.textContent =
        "Generating electron probability cloud...";


    const positions =
        new Float32Array(
            PARTICLE_COUNT * 3
        );


    const colors =
        new Float32Array(
            PARTICLE_COUNT * 3
        );


    let created = 0;


    while (
        created <
        PARTICLE_COUNT
    )
    {
        const p =
            randomSpherePoint();


        const probability =
            orbitalProbability(
                p.x,
                p.y,
                p.z
            );


        // Scale into roughly 0 -> 1.

        const density =
            Math.min(
                probability / 6.2,
                1.0
            );


        // Rejection sampling.

        if (
            Math.random() >
            density
        )
        {
            continue;
        }


        const i =
            created * 3;


        positions[i] =
            p.x;

        positions[i + 1] =
            p.y;

        positions[i + 2] =
            p.z;


        setParticleColor(
            colors,
            i,
            density
        );


        created++;
    }


    const geometry =
        new THREE.BufferGeometry();


    geometry.setAttribute(
        "position",

        new THREE.BufferAttribute(
            positions,
            3
        )
    );


    geometry.setAttribute(
        "color",

        new THREE.BufferAttribute(
            colors,
            3
        )
    );


    const material =
        new THREE.PointsMaterial({

            size:
                POINT_SIZE,

            vertexColors:
                true,

            transparent:
                true,

            opacity:
                0.85,

            blending:
                THREE.AdditiveBlending,

            depthWrite:
                false

        });


    orbitalCloud =
        new THREE.Points(
            geometry,
            material
        );


    atom.add(
        orbitalCloud
    );


    statusText.textContent =
        "50,000 electron probability points";
}


// =====================================================
// NUCLEUS
// =====================================================

const nucleusGroup =
    new THREE.Group();


atom.add(
    nucleusGroup
);


const nucleonGeometry =
    new THREE.SphereGeometry(
        0.42,
        20,
        20
    );


const protonMaterial =
    new THREE.MeshBasicMaterial({

        color:
            0xff3030

    });


const neutronMaterial =
    new THREE.MeshBasicMaterial({

        color:
            0x307cff

    });


function addNucleon(
    x,
    y,
    z,
    material
)
{
    const sphere =
        new THREE.Mesh(
            nucleonGeometry,
            material
        );


    sphere.position.set(
        x,
        y,
        z
    );


    nucleusGroup.add(
        sphere
    );
}


// Small nucleus

addNucleon(
    -0.35,
    0,
    0,
    protonMaterial
);


addNucleon(
    0.35,
    0,
    0,
    neutronMaterial
);


addNucleon(
    0,
    0.40,
    0,
    protonMaterial
);


addNucleon(
    0,
    -0.40,
    0,
    neutronMaterial
);


addNucleon(
    0,
    0,
    0.40,
    protonMaterial
);


// =====================================================
// CAMERA UPDATE
// =====================================================

function updateCamera()
{
    const cosPitch =
        Math.cos(
            cameraPitch
        );


    camera.position.x =
        Math.cos(cameraYaw) *
        cosPitch *
        cameraDistance;


    camera.position.y =
        Math.sin(cameraPitch) *
        cameraDistance;


    camera.position.z =
        Math.sin(cameraYaw) *
        cosPitch *
        cameraDistance;


    camera.lookAt(
        0,
        0,
        0
    );
}


updateCamera();


// =====================================================
// MOUSE CAMERA
// =====================================================

let dragging = false;

let previousX = 0;

let previousY = 0;


// Mouse down

renderer.domElement.addEventListener(
    "mousedown",

    function(event)
    {
        if (event.button === 0)
        {
            dragging = true;

            previousX =
                event.clientX;

            previousY =
                event.clientY;
        }
    }
);


// Mouse up

window.addEventListener(
    "mouseup",

    function()
    {
        dragging = false;
    }
);


// Mouse movement

window.addEventListener(
    "mousemove",

    function(event)
    {
        if (!dragging)
        {
            return;
        }


        const dx =
            event.clientX -
            previousX;


        const dy =
            event.clientY -
            previousY;


        previousX =
            event.clientX;

        previousY =
            event.clientY;


        cameraYaw -=
            dx * 0.006;


        cameraPitch +=
            dy * 0.006;


        // Stop camera flipping.

        cameraPitch =
            Math.max(
                -1.45,

                Math.min(
                    1.45,
                    cameraPitch
                )
            );


        updateCamera();
    }
);


// =====================================================
// MOUSE WHEEL ZOOM
// =====================================================

renderer.domElement.addEventListener(
    "wheel",

    function(event)
    {
        event.preventDefault();


        cameraDistance +=
            event.deltaY *
            0.015;


        cameraDistance =
            Math.max(
                7,

                Math.min(
                    70,
                    cameraDistance
                )
            );


        updateCamera();
    },

    {
        passive: false
    }
);


// =====================================================
// KEYBOARD
// =====================================================

let autoRotate = true;


window.addEventListener(
    "keydown",

    function(event)
    {
        const key =
            event.key.toLowerCase();


        // Pause

        if (key === "p")
        {
            autoRotate =
                !autoRotate;
        }


        // Regenerate

        if (key === "r")
        {
            createOrbital();
        }
    }
);


// =====================================================
// RESIZE
// =====================================================

window.addEventListener(
    "resize",

    function()
    {
        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);


// =====================================================
// CREATE CLOUD
// =====================================================

createOrbital();


// =====================================================
// ANIMATION LOOP
// =====================================================

function animate()
{
    requestAnimationFrame(
        animate
    );


    if (
        autoRotate &&
        orbitalCloud !== null &&
        !dragging
    )
    {
        orbitalCloud.rotation.y +=
            0.0015;


        nucleusGroup.rotation.y =
            orbitalCloud.rotation.y;
    }


    renderer.render(
        scene,
        camera
    );
}


animate();