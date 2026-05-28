'use client';

import { useEffect, useRef } from 'react';

export function InteractiveShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animRef   = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_pos;
      void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;

    const fsSource = `
      precision mediump float;
      uniform vec2  u_res;
      uniform vec2  u_mouse;
      uniform float u_time;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(
          mix(hash(i), hash(i+vec2(1,0)), u.x),
          mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v=0.0, a=0.5;
        for(int i=0;i<6;i++){v+=a*noise(p);p=p*2.1+vec2(1.7,9.2);a*=0.5;}
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_res;
        float t  = u_time * 0.18;

        vec2 q = vec2(fbm(uv+t), fbm(uv+vec2(1.0)));
        vec2 r = vec2(
          fbm(uv + 1.2*q + vec2(1.7,9.2) + 0.18*t),
          fbm(uv + 1.2*q + vec2(8.3,2.8) + 0.13*t)
        );
        float f = fbm(uv + r);

        float dist   = distance(uv, u_mouse);
        float glow   = smoothstep(0.45, 0.0, dist) * 0.35;
        float bright = f*f*f*3.5 + glow;

        /* red-black-crimson palette */
        vec3 col = mix(vec3(0.0),          vec3(0.12,0.0,0.0), clamp(f*f*4.5,0.,1.));
        col      = mix(col,                vec3(0.40,0.02,0.02), clamp(bright,0.,1.));
        col      = mix(col,                vec3(0.70,0.05,0.05), clamp(glow*2.5,0.,1.));

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER,   vsSource));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes   = gl.getUniformLocation(prog, 'u_res');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uTime  = gl.getUniformLocation(prog, 'u_time');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX/window.innerWidth, y: 1-e.clientY/window.innerHeight };
    };
    window.addEventListener('mousemove', onMove);

    const start = performance.now();
    const draw = () => {
      const t = (performance.now() - start) / 1000;
      gl.uniform2f(uRes,   canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(uTime,  t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
