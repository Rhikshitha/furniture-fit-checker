import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FurnitureModel } from '../models/FurnitureModels';

interface CameraARViewerProps {
  selectedFurniture: FurnitureModel | null;
  roomDimensions: { width: number; height: number; depth: number };
  onBack: () => void;
}

const CameraARViewer: React.FC<CameraARViewerProps> = ({ selectedFurniture, roomDimensions, onBack }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [furnitureScale, setFurnitureScale] = useState(1);
  const [furniturePosition, setFurniturePosition] = useState({ x: 50, y: 50 });
  
  const checkFit = () => {
    if (!selectedFurniture) return true;
    
    const scaledWidth = selectedFurniture.dimensions.width * furnitureScale;
    const scaledDepth = selectedFurniture.dimensions.depth * furnitureScale;
    
    return scaledWidth <= roomDimensions.width && scaledDepth <= roomDimensions.depth;
  };

  const fits = checkFit();

  const moveFurniture = (direction: 'left' | 'right' | 'up' | 'down') => {
    const step = 10;
    setFurniturePosition(prev => {
      switch(direction) {
        case 'left': return { ...prev, x: Math.max(0, prev.x - step) };
        case 'right': return { ...prev, x: Math.min(100, prev.x + step) };
        case 'up': return { ...prev, y: Math.max(0, prev.y - step) };
        case 'down': return { ...prev, y: Math.min(100, prev.y + step) };
        default: return prev;
      }
    });
  };

  const adjustScale = (increase: boolean) => {
    setFurnitureScale(prev => {
      const newScale = increase ? prev * 1.1 : prev * 0.9;
      return Math.max(0.1, Math.min(3, newScale));
    });
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        <View style={styles.arOverlay}>
          {selectedFurniture && (
            <View 
              style={[
                styles.furnitureBox,
                {
                  width: (selectedFurniture.dimensions.width / 2) * furnitureScale,
                  height: (selectedFurniture.dimensions.height / 2) * furnitureScale,
                  backgroundColor: selectedFurniture.color,
                  borderColor: fits ? '#00FF00' : '#FF0000',
                  borderWidth: 4,
                  left: `${furniturePosition.x}%`,
                  top: `${furniturePosition.y}%`,
                  transform: [
                    { translateX: -(selectedFurniture.dimensions.width / 4) * furnitureScale },
                    { translateY: -(selectedFurniture.dimensions.height / 4) * furnitureScale }
                  ]
                }
              ]}
            >
              <Text style={styles.furnitureLabel}>{selectedFurniture.name}</Text>
            </View>
          )}
          
          <View style={styles.statusBar}>
            <View style={[styles.fitIndicator, { backgroundColor: fits ? '#00FF0080' : '#FF000080' }]}>
              <Text style={styles.fitText}>{fits ? '✓ FITS!' : '✗ DOESN\'T FIT'}</Text>
            </View>
            {selectedFurniture && (
              <View style={styles.infoBox}>
                <Text style={styles.dimensionsText}>
                  {selectedFurniture.name}
                </Text>
                <Text style={styles.dimensionsText}>
                  Size: {selectedFurniture.dimensions.width} × {selectedFurniture.dimensions.height} × {selectedFurniture.dimensions.depth} cm
                </Text>
                <Text style={styles.dimensionsText}>
                  Room: {roomDimensions.width} × {roomDimensions.height} × {roomDimensions.depth} cm
                </Text>
                <Text style={styles.dimensionsText}>
                  Scale: {(furnitureScale * 100).toFixed(0)}%
                </Text>
              </View>
            )}
          </View>

          <View style={styles.controls}>
            <View style={styles.scaleControls}>
              <TouchableOpacity style={styles.scaleButton} onPress={() => adjustScale(false)}>
                <Text style={styles.controlText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.scaleLabel}>Scale</Text>
              <TouchableOpacity style={styles.scaleButton} onPress={() => adjustScale(true)}>
                <Text style={styles.controlText}>+</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.moveControls}>
              <View style={styles.controlRow}>
                <TouchableOpacity style={styles.controlButton} onPress={() => moveFurniture('up')}>
                  <Text style={styles.controlText}>↑</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.controlRow}>
                <TouchableOpacity style={styles.controlButton} onPress={() => moveFurniture('left')}>
                  <Text style={styles.controlText}>←</Text>
                </TouchableOpacity>
                <View style={styles.controlButton}>
                  <Text style={styles.controlText}>◉</Text>
                </View>
                <TouchableOpacity style={styles.controlButton} onPress={() => moveFurniture('right')}>
                  <Text style={styles.controlText}>→</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.controlRow}>
                <TouchableOpacity style={styles.controlButton} onPress={() => moveFurniture('down')}>
                  <Text style={styles.controlText}>↓</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>Back to Selection</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 50,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  arOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  furnitureBox: {
    position: 'absolute',
    opacity: 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  furnitureLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    borderWidth: 2,
    borderColor: 'white',
  },
  fitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  infoBox: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 10,
  },
  dimensionsText: {
    color: 'white',
    fontSize: 12,
    marginVertical: 2,
  },
  controls: {
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
  scaleControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  scaleButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleLabel: {
    marginHorizontal: 10,
    fontWeight: 'bold',
  },
  moveControls: {
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 2,
  },
  controlButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  controlText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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

export default CameraARViewer;