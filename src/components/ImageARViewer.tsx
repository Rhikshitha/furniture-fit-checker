import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Dimensions, PanResponder } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FurnitureModel } from '../models/FurnitureModels';

interface ImageARViewerProps {
  selectedFurniture: FurnitureModel | null;
  furnitureImage?: string;
  onBack: () => void;
}

const ImageARViewer: React.FC<ImageARViewerProps> = ({ selectedFurniture, furnitureImage, onBack }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [furnitureScale, setFurnitureScale] = useState(0.5);
  const [furniturePosition, setFurniturePosition] = useState({ x: Dimensions.get('window').width / 2, y: Dimensions.get('window').height / 2 });
  const [isPlaced, setIsPlaced] = useState(false);
  const [spaceDetected, setSpaceDetected] = useState(true); 
  
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const checkFit = () => {
    if (!selectedFurniture) return true;
    
    const furnitureWidth = (selectedFurniture.dimensions.width * furnitureScale);
    const furnitureHeight = (selectedFurniture.dimensions.height * furnitureScale);
    
   
    const withinBounds = 
      furniturePosition.x > 50 && 
      furniturePosition.x < screenWidth - 50 &&
      furniturePosition.y > 100 && 
      furniturePosition.y < screenHeight - 200;
    
    const reasonableSize = furnitureWidth < screenWidth * 0.8 && furnitureHeight < screenHeight * 0.5;
    
    return withinBounds && reasonableSize && spaceDetected;
  };

  const fits = checkFit();

  // Pan responder for dragging furniture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        setFurniturePosition({
          x: gestureState.moveX,
          y: gestureState.moveY
        });
        setIsPlaced(true);
      },
      onPanResponderRelease: () => {
        setIsPlaced(true);
      }
    })
  ).current;

  const adjustScale = (increase: boolean) => {
    setFurnitureScale(prev => {
      const newScale = increase ? prev * 1.2 : prev * 0.8;
      return Math.max(0.1, Math.min(2, newScale));
    });
  };

  const resetPlacement = () => {
    setFurniturePosition({ x: screenWidth / 2, y: screenHeight / 2 });
    setFurnitureScale(0.5);
    setIsPlaced(false);
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

  const furnitureWidth = selectedFurniture ? selectedFurniture.dimensions.width * furnitureScale : 150;
  const furnitureHeight = selectedFurniture ? selectedFurniture.dimensions.height * furnitureScale : 150;

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        <View style={styles.arOverlay}>
         
          <View style={styles.gridOverlay} pointerEvents="none">
            {[...Array(5)].map((_, i) => (
              <View key={`h-${i}`} style={[styles.gridLineHorizontal, { top: `${(i + 1) * 20}%` }]} />
            ))}
            {[...Array(5)].map((_, i) => (
              <View key={`v-${i}`} style={[styles.gridLineVertical, { left: `${(i + 1) * 20}%` }]} />
            ))}
          </View>

          {selectedFurniture && (
            <View
              {...panResponder.panHandlers}
              style={[
                styles.furnitureContainer,
                {
                  width: furnitureWidth,
                  height: furnitureHeight,
                  left: furniturePosition.x - furnitureWidth / 2,
                  top: furniturePosition.y - furnitureHeight / 2,
                  borderColor: fits ? '#00FF00' : '#FF0000',
                  borderWidth: 3,
                  opacity: isPlaced ? 0.9 : 0.7,
                }
              ]}
            >
              {furnitureImage ? (
                <Image 
                  source={{ uri: furnitureImage }} 
                  style={styles.furnitureImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.placeholderFurniture, { backgroundColor: selectedFurniture.color }]}>
                  <Text style={styles.furnitureLabel}>{selectedFurniture.name}</Text>
                </View>
              )}
            </View>
          )}
          
         
          <View style={styles.statusBar}>
            <View style={[styles.fitIndicator, { backgroundColor: fits ? '#00FF0080' : '#FF000080' }]}>
              <Text style={styles.fitText}>{fits ? '✓ FITS in this space!' : '✗ Too large for this space'}</Text>
            </View>
            {selectedFurniture && (
              <View style={styles.infoBox}>
                <Text style={styles.dimensionsText}>
                  {selectedFurniture.name}
                </Text>
                <Text style={styles.dimensionsText}>
                  Actual Size: {selectedFurniture.dimensions.width} × {selectedFurniture.dimensions.height} cm
                </Text>
                <Text style={styles.dimensionsText}>
                  Scale: {(furnitureScale * 100).toFixed(0)}%
                </Text>
                <Text style={styles.instructionText}>
                  Drag furniture to position • Use +/- to scale
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
            
            <TouchableOpacity style={styles.resetButton} onPress={resetPlacement}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
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
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  furnitureContainer: {
    position: 'absolute',
    borderRadius: 8,
    padding: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  furnitureImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  placeholderFurniture: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    opacity: 0.8,
  },
  furnitureLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
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
    fontSize: 16,
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
  instructionText: {
    color: '#FFD700',
    fontSize: 11,
    marginTop: 5,
    fontStyle: 'italic',
  },
  controls: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
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
  controlText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetText: {
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

export default ImageARViewer;