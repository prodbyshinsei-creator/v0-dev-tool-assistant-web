'use client';
import { useEffect, useRef } from 'react';

type Theme = 'crimson'|'void'|'abyss'|'solana';

// Each theme: 4 color stops [r,g,b] normalized 0-1
const PALETTES: Record<Theme,[number,number,number][]> = {
  crimson: [[0,0,0],[0.12,0,0],[0.35,0.02,0.02],[0.5,0.04,0.04]],
  void:    [[0.01,0.01,0.015],[0.04,0.04,0.06],[0.1,0.1,0.14],[0.18,0.18,0.22]],
  abyss:   [[0,0,0.02],[0,0.02,0.12],[0.01,0.05,0.24],[0.02,0.08,0.35]],
  // Solana: dark purple → dark green (brand: #9945FF, #14F195)
  solana:  [[0.01,0,0.04],[0.04,0,0.14],[0.01,0.07,0.05],[0.02,0.12,0.07]],
};

interface Props { theme?: Theme }

export function InteractiveShaderBackground({ theme='crimson' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({x:0.5,y:0.5});
  const animRef   = useRef<number>(0);
  const themeRef  = useRef(theme);
  useEffect(()=>{ themeRef.current=theme; },[theme]);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const gl=canvas.getContext('webgl'); if(!gl) return;

    const vs=`attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;
    const fs=`
      precision mediump float;
      uniform vec2 uR,uM; uniform float uT;
      uniform vec3 c1,c2,c3,c4;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
      float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<6;i++){v+=a*n(p);p=p*2.1+vec2(1.7,9.2);a*=.5;}return v;}
      void main(){
        vec2 uv=gl_FragCoord.xy/uR;float t=uT*.18;
        vec2 q=vec2(fbm(uv+t),fbm(uv+vec2(1)));
        vec2 r=vec2(fbm(uv+1.2*q+vec2(1.7,9.2)+.18*t),fbm(uv+1.2*q+vec2(8.3,2.8)+.13*t));
        float f=fbm(uv+r);
        float d=distance(uv,uM); float g=smoothstep(.45,.0,d)*.35;
        float b=f*f*f*3.5+g;
        vec3 col=mix(c1,c2,clamp(f*f*4.5,0.,1.));
        col=mix(col,c3,clamp(b,0.,1.));
        col=mix(col,c4,clamp(g*2.5,0.,1.));
        gl_FragColor=vec4(col,1);
      }`;

    function comp(type:number,src:string){const s=gl!.createShader(type)!;gl!.shaderSource(s,src);gl!.compileShader(s);return s;}
    const prog=gl.createProgram()!;
    gl.attachShader(prog,comp(gl.VERTEX_SHADER,vs));
    gl.attachShader(prog,comp(gl.FRAGMENT_SHADER,fs));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,'a');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const uR=gl.getUniformLocation(prog,'uR'),uM=gl.getUniformLocation(prog,'uM'),uT=gl.getUniformLocation(prog,'uT');
    const uC=[gl.getUniformLocation(prog,'c1'),gl.getUniformLocation(prog,'c2'),gl.getUniformLocation(prog,'c3'),gl.getUniformLocation(prog,'c4')];

    const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;gl.viewport(0,0,canvas.width,canvas.height);};
    resize(); window.addEventListener('resize',resize);
    const onMove=(e:MouseEvent)=>{mouseRef.current={x:e.clientX/window.innerWidth,y:1-e.clientY/window.innerHeight};};
    window.addEventListener('mousemove',onMove);
    const start=performance.now();
    const draw=()=>{
      const t=(performance.now()-start)/1000;
      const pal=PALETTES[themeRef.current];
      gl.uniform2f(uR,canvas.width,canvas.height);
      gl.uniform2f(uM,mouseRef.current.x,mouseRef.current.y);
      gl.uniform1f(uT,t);
      pal.forEach(([r,g,b],i)=>gl.uniform3f(uC[i],r,g,b));
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      animRef.current=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(animRef.current);window.removeEventListener('resize',resize);window.removeEventListener('mousemove',onMove);};
  },[]);

  return <canvas ref={canvasRef} style={{position:'fixed',inset:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none'}}/>;
}
