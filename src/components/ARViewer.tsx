import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { Canvas } from '@react-three/fiber/native';
import * as THREE from 'three';
import { FurnitureModel, checkFit } from '../models/FurnitureModels';

interface ARViewerProps {
  selectedFurniture: FurnitureModel | null;
  roomDimensions: { width: number; height: number; depth: number };
  onBack: () => void;
}

const FurnitureObject: React.FC<{
  furniture: FurnitureModel;
  position: [number, number, number];
  fits: boolean;
}> = ({ furniture, position, fits }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[
        furniture.dimensions.width / 100,
        furniture.dimensions.height / 100,
        furniture.dimensions.depth / 100
      ]} />
      <meshStandardMaterial 
        color={fits ? furniture.color : '#FF0000'} 
        opacity={0.8}
        transparent
      />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(
          furniture.dimensions.width / 100,
          furniture.dimensions.height / 100,
          furniture.dimensions.depth / 100
        )]} />
        <lineBasicMaterial color={fits ? '#00FF00' : '#FF0000'} linewidth={2} />
      </lineSegments>
    </mesh>
  );
};

const ARViewer: React.FC<ARViewerProps> = ({ selectedFurniture, roomDimensions, onBack }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [furniturePosition, setFurniturePosition] = useState<[number, number, number]>([0, 0, -2]);
  const [fits, setFits] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (selectedFurniture) {
      const position = new THREE.Vector3(...furniturePosition);
      const fitCheck = checkFit(selectedFurniture, position, roomDimensions);
      setFits(fitCheck);
    }
  }, [furniturePosition, selectedFurniture, roomDimensions]);

  const moveFurniture = (direction: 'left' | 'right' | 'forward' | 'backward' | 'up' | 'down') => {
    const step = 0.2;
    setFurniturePosition(prev => {
      switch(direction) {
        case 'left': return [prev[0] - step, prev[1], prev[2]];
        case 'right': return [prev[0] + step, prev[1], prev[2]];
        case 'forward': return [prev[0], prev[1], prev[2] - step];
        case 'backward': return [prev[0], prev[1], prev[2] + step];
        case 'up': return [prev[0], prev[1] + step, prev[2]];
        case 'down': return [prev[0], Math.max(0, prev[1] - step), prev[2]];
        default: return prev;
      }
    });
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera}>
        <View style={styles.arOverlay}>
          {selectedFurniture && (
            <Canvas
              style={StyleSheet.absoluteFillObject}
              camera={{ position: [0, 1, 5], fov: 75 }}
            >
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <FurnitureObject 
                furniture={selectedFurniture} 
                position={furniturePosition}
                fits={fits}
              />
              <gridHelper args={[10, 10]} position={[0, 0, 0]} />
            </Canvas>
          )}
          
          <View style={styles.statusBar}>
            <View style={[styles.fitIndicator, { backgroundColor: fits ? '#00FF00' : '#FF0000' }]}>
              <Text style={styles.fitText}>{fits ? 'FITS!' : 'DOESN\'T FIT'}</Text>
            </View>
            {selectedFurniture && (
              <Text style={styles.dimensionsText}>
                {selectedFurniture.name}: {selectedFurniture.dimensions.width} x {selectedFurniture.dimensions.height} x {selectedFurniture.dimensions.depth} cm
              </Text>
            )}
          </View>

          <View style={styles.controls}>
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.controlButton} onPress={() => moveFurniture('up')}>
                <Text style={styles.controlText}>↑</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.controlButton} onPress={() => moveFurniture('left')}>
                <Text style={styles.controlText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={() => moveFurniture('forward')}>
                <Text style={styles.controlText}>⬆</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={() => moveFurniture('right')}>
                <Text style={styles.controlText}>→</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.controlButton} onPress={() => moveFurniture('down')}>
                <Text style={styles.controlText}>↓</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={() => moveFurniture('backward')}>
                <Text style={styles.controlText}>⬇</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>Back to Selection</Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  arOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  statusBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  fitIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'white',
  },
  fitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  dimensionsText: {
    color: 'white',
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 5,
  },
  controls: {
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 5,
  },
  controlButton: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  controlText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  backText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ARViewer;