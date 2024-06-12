const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');

const N = 512;

let worldWidth = canvas.width;
let worldHeight = canvas.height;

const updateWorldSettings = () => {
  if (worldHeight !== window.innerHeight || worldWidth !== window.innerWidth) {
    worldWidth = window.innerWidth;
    worldHeight = window.innerHeight;
    worldWidth = N;
    worldHeight = N;
    canvas.width = worldWidth;
    canvas.height = worldHeight;
  }
};

updateWorldSettings();


const update = () => {
  // const t1 = new Date().getTime();


  ctx.clearRect(0, 0, worldWidth, worldHeight);


  // const t2 = new Date().getTime();
  // console.log(t2 - t1);

  updateWorldSettings();

  requestAnimationFrame(update);
}

update();
