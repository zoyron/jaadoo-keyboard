import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const FlatSurfaceVisual = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.offsetWidth || 300;
    const height = containerRef.current.offsetHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create a flat green plane
    const geometry = new THREE.PlaneGeometry(3, 3);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        transparent: true, 
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(geometry, material);
    
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const line = new THREE.LineSegments(edges, lineMaterial);
    plane.add(line);

    plane.rotation.x = -Math.PI / 4; 
    scene.add(plane);

    let animationId: number;
    const animate = (time: number) => {
      animationId = requestAnimationFrame(animate);
      const pulse = 0.3 + Math.sin(time * 0.002) * 0.2;
      material.opacity = pulse;
      plane.rotation.z += 0.005;
      renderer.render(scene, camera);
    };

    animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.offsetWidth;
      const h = containerRef.current.offsetHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) {
        if (rendererRef.current.domElement.parentElement) {
            rendererRef.current.domElement.parentElement.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
      geometry.dispose();
      material.dispose();
      edges.dispose();
      lineMaterial.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '200px' }} />;
};

export default FlatSurfaceVisual;
