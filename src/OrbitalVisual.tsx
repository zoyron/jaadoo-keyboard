import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const OrbitalVisual = () => {
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

    const ringCount = 3;
    const rings: THREE.Group[] = [];
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });

    for (let i = 0; i < ringCount; i++) {
        const group = new THREE.Group();
        const geometry = new THREE.TorusGeometry(2 + i * 0.5, 0.02, 16, 100);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.6 });
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        
        const dotGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const dotMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        dot.position.x = 2 + i * 0.5;
        group.add(dot);

        group.rotation.x = Math.random() * Math.PI;
        group.rotation.y = Math.random() * Math.PI;
        
        scene.add(group);
        rings.push(group);
    }

    const coreGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    let animationId: number;
    const animate = (time: number) => {
      animationId = requestAnimationFrame(animate);

      rings.forEach((group, index) => {
        // Significantly reduced movement speed (4x slower)
        group.rotation.x += 0.002 * (index + 0.5);
        group.rotation.y += 0.003;
        group.rotation.z += 0.001;
      });

      // Slower, more subtle pulse to core
      const corePulse = 0.7 + Math.sin(time * 0.001) * 0.1;
      coreMaterial.opacity = corePulse;

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
      coreGeometry.dispose();
      coreMaterial.dispose();
      rings.forEach(r => {
          r.children.forEach(c => {
              if (c instanceof THREE.Mesh) {
                  c.geometry.dispose();
                  if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                  else c.material.dispose();
              }
          })
      })
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '200px' }} />;
};

export default OrbitalVisual;
