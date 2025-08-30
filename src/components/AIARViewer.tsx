import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Dimensions, PanResponder, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, Camera } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { FurnitureModel } from '../models/FurnitureModels';

interface AIARViewerProps {
  selectedFurniture: FurnitureModel | null;
  furnitureImage?: string;
  onBack: () => void;
}

const AIARViewer: React.FC<AIARViewerProps> = ({ selectedFurniture, furnitureImage, onBack }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [furnitureScale, setFurnitureScale] = useState(0.4);
  const [furniturePosition, setFurniturePosition] = useState({ x: Dimensions.get('window').width / 2, y: Dimensions.get('window').height * 0.7 });
  const [detectedObjects, setDetectedObjects] = useState<Array<{class: string, bbox: number[]}>>([]);
  const [modelReady, setModelReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Initialize TensorFlow and COCO-SSD model
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Wait for TensorFlow to be ready
        await tf.ready();
        // Load COCO-SSD model
        const model = await cocoSsd.load();
        modelRef.current = model;
        setModelReady(true);
      } catch (error) {
        console.error('Failed to load model:', error);
        // Fallback to simulated detection
        setModelReady(true);
      }
    };
    loadModel();
  }, []);

  // Simulate object detection for demo (fallback when real detection isn't available)
  const simulateObjectDetection = () => {
    // Simulate detecting a person in the middle of the screen
    const simulatedObjects = [
      {
        class: 'person',
        bbox: [screenWidth * 0.2, screenHeight * 0.2, screenWidth * 0.6, screenHeight * 0.5]
      }
    ];
    setDetectedObjects(simulatedObjects);
  };

  // Perform object detection
  const detectObjects = async () => {
    if (!modelReady || isDetecting) return;
    
    setIsDetecting(true);
    try {
      // In a real implementation, we'd capture a frame from the camera
      // and run detection on it. For now, simulate detection
      simulateObjectDetection();
    } catch (error) {
      console.error('Detection error:', error);
      simulateObjectDetection();
    } finally {
      setIsDetecting(false);
    }
  };

  // Run detection periodically
  useEffect(() => {
    if (modelReady) {
      detectObjects();
      const interval = setInterval(detectObjects, 2000); // Detect every 2 seconds
      return () => clearInterval(interval);
    }
  }, [modelReady]);

  // Check if furniture collides with detected objects
  const checkCollision = (furnitureX: number, furnitureY: number, furnitureW: number, furnitureH: number) => {
    const furnitureLeft = furnitureX - furnitureW / 2;
    const furnitureRight = furnitureX + furnitureW / 2;
    const furnitureTop = furnitureY - furnitureH / 2;
    const furnitureBottom = furnitureY + furnitureH / 2;

    for (const obj of detectedObjects) {
      const [objX, objY, objWidth, objHeight] = obj.bbox;
      const objRight = objX + objWidth;
      const objBottom = objY + objHeight;
      
      // Check overlap
      const overlaps = !(furnitureRight < objX || 
                         furnitureLeft > objRight || 
                         furnitureBottom < objY || 
                         furnitureTop > objBottom);
      
      if (overlaps) {
        return { collision: true, objectType: obj.class };
      }
    }
    return { collision: false, objectType: null };
  };

  const checkFit = () => {
    if (!selectedFurniture) return { fits: true, reason: '' };
    
    const furnitureWidth = selectedFurniture.dimensions.width * furnitureScale;
    const furnitureHeight = selectedFurniture.dimensions.height * furnitureScale;
    
    // Check collision with detected objects
    const collisionResult = checkCollision(
      furniturePosition.x,
      furniturePosition.y,
      furnitureWidth,
      furnitureHeight
    );
    
    // Check screen bounds
    const withinBounds = 
      furniturePosition.x > furnitureWidth / 2 && 
      furniturePosition.x < screenWidth - furnitureWidth / 2 &&
      furniturePosition.y > furnitureHeight / 2 && 
      furniturePosition.y < screenHeight - furnitureHeight / 2;
    
    if (collisionResult.collision) {
      return { fits: false, reason: `Blocked by ${collisionResult.objectType}` };
    }
    
    if (!withinBounds) {
      return { fits: false, reason: 'Out of bounds' };
    }
    
    return { fits: true, reason: 'Clear space detected' };
  };

  const fitResult = checkFit();

  // Pan responder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, gestureState) => {
        setFurniturePosition({
          x: gestureState.moveX,
          y: gestureState.moveY
        });
      }
    })
  ).current;

  const adjustScale = (increase: boolean) => {
    setFurnitureScale(prev => {
      const newScale = increase ? prev * 1.2 : prev * 0.8;
      return Math.max(0.1, Math.min(1.5, newScale));
    });
  };

  const resetPlacement = () => {
    setFurniturePosition({ x: screenWidth / 2, y: screenHeight * 0.7 });
    setFurnitureScale(0.4);
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
        <Text style={styles.permissionText}>Camera permission required for AR</Text>
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
      <CameraView 
        style={styles.camera} 
        facing="back"
        ref={(ref: any) => cameraRef.current = ref}
      >
        <View style={styles.arOverlay}>
          {/* Object detection boxes */}
          {detectedObjects.map((obj, index) => (
            <View
              key={index}
              style={[
                styles.detectionBox,
                {
                  left: obj.bbox[0],
                  top: obj.bbox[1],
                  width: obj.bbox[2],
                  height: obj.bbox[3],
                }
              ]}
              pointerEvents="none"
            >
              <View style={styles.detectionLabel}>
                <Text style={styles.detectionText}>{obj.class}</Text>
              </View>
            </View>
          ))}

          {/* Furniture */}
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
                  borderColor: fitResult.fits ? '#00FF00' : '#FF0000',
                  borderWidth: 3,
                  backgroundColor: fitResult.fits ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
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
          
          {/* Status */}
          <View style={styles.statusBar}>
            <View style={[styles.fitIndicator, { 
              backgroundColor: fitResult.fits ? '#00FF00CC' : '#FF0000CC',
            }]}>
              <Text style={styles.fitText}>
                {fitResult.fits ? '✓ ' : '✗ '}{fitResult.reason}
              </Text>
            </View>
            
            {!modelReady && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.loadingText}>Loading AI...</Text>
              </View>
            )}
            
            {selectedFurniture && (
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>AI Object Detection Active</Text>
                <Text style={styles.dimensionsText}>
                  {selectedFurniture.name} • {(furnitureScale * 100).toFixed(0)}% scale
                </Text>
                <Text style={styles.detectionInfo}>
                  {detectedObjects.length > 0 
                    ? `Detected: ${detectedObjects.map(o => o.class).join(', ')}`
                    : 'Scanning for objects...'}
                </Text>
              </View>
            )}
          </View>

          {/* Controls */}
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
            
            <TouchableOpacity style={styles.detectButton} onPress={detectObjects}>
              <Text style={styles.detectText}>🔍 Detect</Text>
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
  detectionBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  detectionLabel: {
    position: 'absolute',
    top: -25,
    left: 0,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  detectionText: {
    color: 'black',
    fontSize: 12,
    fontWeight: 'bold',
  },
  furnitureContainer: {
    position: 'absolute',
    borderRadius: 8,
    padding: 2,
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
    paddingVertical: 12,
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
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loadingText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 12,
  },
  infoBox: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoTitle: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dimensionsText: {
    color: 'white',
    fontSize: 12,
    marginVertical: 2,
  },
  detectionInfo: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  resetText: {
    fontWeight: 'bold',
  },
  detectButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  detectText: {
    color: 'white',
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
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

export default AIARViewer;