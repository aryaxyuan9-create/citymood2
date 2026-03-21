import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
attribute vec4 aVertexPosition;
void main() { gl_Position = aVertexPosition; }
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
const vec3 colorBase = vec3(1.0, 0.992, 0.976);
const vec3 colorAmber = vec3(1.0, 0.749, 0.0);
const vec3 colorHoney = vec3(0.984, 0.827, 0.353);
const vec3 colorTerracotta = vec3(0.816, 0.447, 0.337);
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
    vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
    vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod(i,289.0);
    vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
    vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
    m=m*m; m=m*m;
    vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5;
    vec3 ox=floor(x+0.5); vec3 a0=x-ox;
    m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
    vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.0*dot(m,g);
}
void main(){
    vec2 st=gl_FragCoord.xy/u_resolution.xy; st.x*=u_resolution.x/u_resolution.y;
    vec2 mouse=u_mouse/u_resolution.xy; mouse.x*=u_resolution.x/u_resolution.y;
    vec2 pos=st*1.5;
    float n1=snoise(pos+u_time*0.08); float n2=snoise(pos-u_time*0.12+vec2(20.0));
    vec3 color=colorBase;
    float distMouse=length(st-mouse)+n1*0.1;
    float glowMouse=smoothstep(0.7,0.0,distMouse);
    vec3 mouseColor=mix(colorHoney,colorAmber,n2*0.5+0.5);
    color=mix(color,mouseColor,glowMouse*0.6);
    vec2 center1=vec2((u_resolution.x/u_resolution.y)*0.3+sin(u_time*0.15)*0.4,0.6+cos(u_time*0.2)*0.3);
    float distCenter1=length(st-center1)+n2*0.25;
    color=mix(color,colorHoney,smoothstep(1.2,0.0,distCenter1)*0.5);
    vec2 center2=vec2((u_resolution.x/u_resolution.y)*0.7+cos(u_time*0.1)*0.5,0.1+sin(u_time*0.2)*0.2);
    float distCenter2=length(st-center2)+n1*0.2;
    color=mix(color,colorTerracotta,smoothstep(1.0,0.0,distCenter2)*0.35);
    float noise=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
    color-=noise*0.012;
    gl_FragColor=vec4(color,1.0);
}
`;

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    // Compile shader helper
    function compileShader(type: number, source: string) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      return shader;
    }

    const vert = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const frag = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };

    resizeCanvas();

    const onMouseMove = (e: MouseEvent) => {
      const dpr = window.devicePixelRatio || 1;
      targetMouseX = e.clientX * dpr;
      targetMouseY = (window.innerHeight - e.clientY) * dpr;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", resizeCanvas);

    let startTime = performance.now();
    let raf: number;

    const render = () => {
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const t = (performance.now() - startTime) / 1000;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouseX, mouseY);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
