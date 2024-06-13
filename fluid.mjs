class Fluid {
  constructor({size, scale, dt, diffusion, viscosity}) {
    this.size = size;
    this.scale = scale;
    this.dt = dt;
    this.diff = diffusion;
    this.visc = viscosity;

    this.s = Array(size * size).fill(0);
    this.density = Array(size * size).fill(0);

    this.Vx = Array(size * size).fill(0);
    this.Vy = Array(size * size).fill(0);
    this.Vx0 = Array(size * size).fill(0);
    this.Vy0 = Array(size * size).fill(0);
  }

  addDensity(x, y, amount) {
    const idx = IX(x, y, this.size);
    this.density[idx] += amount;
  }

  addVelocity(x, y, amountX, amountY) {
    const idx = IX(x, y, this.size);
    this.Vx[idx] += amountX;
    this.Vy[idx] += amountY;
  }

  step = () => {
    const N = this.size;
    let visc = this.visc;
    let diff = this.diff;
    let dt = this.dt;
    let Vx = this.Vx;
    let Vy = this.Vy;
    let Vx0 = this.Vx0;
    let Vy0 = this.Vy0;
    let s = this.s;
    let density = this.density;

    const iter = 4;
    diffuse(1, Vx0, Vx, visc, dt, iter, N);
    diffuse(2, Vy0, Vy, visc, dt, iter, N);

    project(Vx0, Vy0, Vx, Vy, iter, N);

    advect(1, Vx, Vx0, Vx0, Vy0, dt, N);
    advect(2, Vy, Vy0, Vx0, Vy0, dt, N);

    project(Vx, Vy, Vx0, Vy0, iter, N);

    diffuse(0, s, density, diff, dt, iter, N);
    advect(0, density, s, Vx, Vy, dt, N);
  }

  renderD(ctx) {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const x = i * this.scale;
        const y = j * this.scale;

        const d = this.density[IX(i, j, this.size)];
        // ctx.strokeStyle = 'rgba(255,0,255,1)';
        // console.log(d);
        // ctx.fillStyle = 'rgba(255,255,255,' + d + ')';
        ctx.fillStyle = 'hsl(' + (d * 10 + 180) + ' 100% 50% / ' + (d * 100) + '%)';
        ctx.beginPath();
        ctx.rect(x, y, this.scale, this.scale);
        ctx.fill();
      }
    }
  }


  fadeD() {
    for (let i = 0; i < this.density.length; i++) {
      let d = this.density[i];
      d -= 0.00001;
      if (d < 0) d = 0;
      // else if (d > 255) d = 255;
      this.density[i] = d;
    }
  }
}

const IX = (x, y, N) => {
  if (x < 0) x = 0;
  if (x > N - 1) x = N - 1;
  if (y < 0) y = 0;
  if (y > N - 1) y = N - 1;
  return x + y * N; // square grid
}

const set_bnd = (b, x, N) => {
  for (let i = 1; i < N - 1; i++) {
    x[IX(i, 0, N)] = b === 2 ? -x[IX(i, 1, N)] : x[IX(i, 1, N)];
    x[IX(i, N - 1, N)] = b === 2 ? -x[IX(i, N - 2, N)] : x[IX(i, N - 2, N)];
  }
  for (let j = 1; j < N - 1; j++) {
    x[IX(0, j, N)] = b === 1 ? -x[IX(1, j, N)] : x[IX(1, j, N)];
    x[IX(N - 1, j, N)] = b === 1 ? -x[IX(N - 2, j, N)] : x[IX(N - 2, j, N)];
  }

  x[IX(0, 0, N)] = 0.5 * (x[IX(1, 0, N)] + x[IX(0, 1, N)]);
  x[IX(0, N - 1, N)] = 0.5 * (x[IX(1, N - 1, N)] + x[IX(0, N - 2, N)]);
  x[IX(N - 1, 0, N)] = 0.5 * (x[IX(N - 2, 0, N)] + x[IX(N - 1, 1, N)]);
  x[IX(N - 1, N - 1, N)] = 0.5 * (x[IX(N - 2, N - 1, N)] + x[IX(N - 1, N - 2, N)]);
};

const diffuse = (b, x, x0, diff, dt, iter, N) => {
  const a = dt * diff * (N - 2) * (N - 2);
  lin_solve(b, x, x0, a, 1 + 6 * a, iter, N);
};

const lin_solve = (b, x, x0, a, c, iter, N) => {
  const cRecip = 1.0 / c;

  for (let k = 0; k < iter; k++) {
    for (let j = 1; j < N - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        x[IX(i, j, N)] =
            (x0[IX(i, j, N)]
                + a * (x[IX(i + 1, j, N)]
                    + x[IX(i - 1, j, N)]
                    + x[IX(i, j + 1, N)]
                    + x[IX(i, j - 1, N)]
                )) * cRecip;
      }
    }
    set_bnd(b, x, N);
  }
};
const project = (velocX, velocY, p, div, iter, N) => {
  for (let j = 1; j < N - 1; j++) {
    for (let i = 1; i < N - 1; i++) {
      div[IX(i, j, N)] = -0.5 * (
          velocX[IX(i + 1, j, N)]
          - velocX[IX(i - 1, j, N)]
          + velocY[IX(i, j + 1, N)]
          - velocY[IX(i, j - 1, N)]
      ) / N;
      p[IX(i, j, N)] = 0;
    }
  }
  set_bnd(0, div, N);
  set_bnd(0, p, N);
  lin_solve(0, p, div, 1, 6, iter, N);

  for (let j = 1; j < N - 1; j++) {
    for (let i = 1; i < N - 1; i++) {
      velocX[IX(i, j, N)] -= 0.5 * (p[IX(i + 1, j, N)]
          - p[IX(i - 1, j, N)]) * N;
      velocY[IX(i, j, N)] -= 0.5 * (p[IX(i, j + 1, N)]
          - p[IX(i, j - 1, N)]) * N;
    }
  }
  set_bnd(1, velocX, N);
  set_bnd(2, velocY, N);
};

const advect = (b, d, d0, velocX, velocY, dt, N) => {
  let i0, i1, j0, j1;

  let dtx = dt * (N - 2);
  let dty = dt * (N - 2);

  let s0, s1, t0, t1;
  let tmp1, tmp2, x, y;

  let i, j;

  for (j = 1; j < N - 1; j++) {
    for (i = 1; i < N - 1; i++) {
      tmp1 = dtx * velocX[IX(i, j, N)];
      tmp2 = dty * velocY[IX(i, j, N)];
      x = i - tmp1;
      y = j - tmp2;

      if (x < 0.5) x = 0.5;
      else if (x > N + .5) x = N + .5;
      i0 = Math.floor(x);
      i1 = i0 + 1.0;
      if (y < 0.5) y = 0.5;
      else if (y > N + .5) y = N + .5;
      j0 = Math.floor(y);
      j1 = j0 + 1.0;

      s1 = x - i0;
      s0 = 1.0 - s1;
      t1 = y - j0;
      t0 = 1.0 - t1;

      let i0i = Math.floor(i0);
      let i1i = Math.floor(i1);
      let j0i = Math.floor(j0);
      let j1i = Math.floor(j1);

      d[IX(i, j, N)] =

          s0 * (t0 * (d0[IX(i0i, j0i, N)])
              + (t1 * (d0[IX(i0i, j1i, N)]
              )))
          + s1 * (t0 * (d0[IX(i1i, j0i, N)])
              + (t1 * (d0[IX(i1i, j1i, N)]
              )));
    }
  }
  set_bnd(b, d, N);
};


export {Fluid};