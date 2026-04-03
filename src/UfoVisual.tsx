import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const UfoVisual = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Create a wireframe Saucer (UFO)
    const saucerGroup = new THREE.Group();

    // Top dome
    const domeGeometry = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const wireMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        wireframe: true,
        transparent: true,
        opacity: 0.7 
    });
    const dome = new THREE.Mesh(domeGeometry, wireMaterial);
    saucerGroup.add(dome);

    // Bottom body
    const bodyGeometry = new THREE.CylinderGeometry(2.5, 1, 0.8, 16, 1, true);
    const body = new THREE.Mesh(bodyGeometry, wireMaterial);
    body.position.y = -0.4;
    saucerGroup.add(body);

    // Outer ring
    const ringGeometry = new THREE.TorusGeometry(3, 0.05, 8, 32);
    const ring = new THREE.Mesh(ringGeometry, wireMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.4;
    saucerGroup.add(ring);

    scene.add(saucerGroup);

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      saucerGroup.rotation.y += 0.01;
      saucerGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.2;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (containerRef.current && renderer.domElement.parentElement === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      domeGeometry.dispose();
      bodyGeometry.dispose();
      ringGeometry.dispose();
      wireMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default UfoVisual;
