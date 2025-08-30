import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Dimensions, PanResponder, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FurnitureModel } from '../models/FurnitureModels';

interface SmartARViewerProps {
  selectedFurniture: FurnitureModel | null;
  furnitureImage?: string;
  onBack: () => void;
}

const SmartARViewer: React.FC<SmartARViewerProps> = ({ selectedFurniture, furnitureImage, onBack }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [furnitureScale, setFurnitureScale] = useState(0.3);
  const [furniturePosition, setFurniturePosition] = useState({ x: Dimensions.get('window').width / 2, y: Dimensions.get('window').height / 2 });
  const [isPlaced, setIsPlaced] = useState(false);
  const [obstacleZones, setObstacleZones] = useState<Array<{x: number, y: number, width: number, height: number}>>([]);
  
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Simulate obstacle detection (in production, use ML/computer vision)
  useEffect(() => {
    // Define zones where obstacles typically are
    // Only mark small areas as obstacles, most space should be clear
    const zones = [
      // Only mark a small area in upper-middle as obstacle (where face typically is)
      { x: screenWidth * 0.35, y: screenHeight * 0.2, width: screenWidth * 0.3, height: screenHeight * 0.25 },
    ];
    setObstacleZones(zones);
  }, [screenWidth, screenHeight]);

  const checkCollision = (furnitureX: number, furnitureY: number, furnitureW: number, furnitureH: number) => {
    // Check if furniture overlaps with any obstacle zone
    for (const zone of obstacleZones) {
      const furnitureLeft = furnitureX - furnitureW / 2;
      const furnitureRight = furnitureX + furnitureW / 2;
      const furnitureTop = furnitureY - furnitureH / 2;
      const furnitureBottom = furnitureY + furnitureH / 2;
      
      const zoneRight = zone.x + zone.width;
      const zoneBottom = zone.y + zone.height;
      
      // Check if furniture overlaps with obstacle
      const overlaps = !(furnitureRight < zone.x || 
                         furnitureLeft > zoneRight || 
                         furnitureBottom < zone.y || 
                         furnitureTop > zoneBottom);
      
      if (overlaps) {
        return true; // Collision detected
      }
    }
    return false; // No collision, space is clear
  };

  const checkFit = () => {
    if (!selectedFurniture) return true;
    
    const furnitureWidth = selectedFurniture.dimensions.width * furnitureScale;
    const furnitureHeight = selectedFurniture.dimensions.height * furnitureScale;
    
    // Check if furniture is in a clear area (no obstacles)
    const hasCollision = checkCollision(
      furniturePosition.x,
      furniturePosition.y,
      furnitureWidth,
      furnitureHeight
    );
    
    // Check if furniture is within screen bounds
    const withinBounds = 
      furniturePosition.x > furnitureWidth / 2 && 
      furniturePosition.x < screenWidth - furnitureWidth / 2 &&
      furniturePosition.y > furnitureHeight / 2 && 
      furniturePosition.y < screenHeight - furnitureHeight / 2;
    
    // Furniture fits if: no collision, within bounds, and reasonable size
    const reasonableSize = furnitureWidth < screenWidth * 0.6 && furnitureHeight < screenHeight * 0.4;
    
    return !hasCollision && withinBounds && reasonableSize;
  };

  const fits = checkFit();

  // Pan responder for dragging furniture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, gestureState) => {
        setFurniturePosition({
          x: gestureState.moveX,
          y: gestureState.moveY
        });
        setIsPlaced(true);
      },
      onPanResponderRelease: () => {
        setIsPlaced(true);
        if (!fits) {
          Alert.alert(
            "Space Occupied", 
            "This space is blocked by an obstacle. Try moving the furniture to an empty area.",
            [{ text: "OK" }]
          );
        }
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
    setFurnitureScale(0.3);
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
          {/* Obstacle detection zones (visual for demo) */}
          {obstacleZones.map((zone, index) => (
            <View
              key={index}
              style={[
                styles.obstacleZone,
                {
                  left: zone.x,
                  top: zone.y,
                  width: zone.width,
                  height: zone.height,
                }
              ]}
              pointerEvents="none"
            >
              <Text style={styles.obstacleLabel}>Obstacle Zone</Text>
            </View>
          ))}

          {/* Safe placement indicator */}
          <View style={styles.placementGuide} pointerEvents="none">
            <View style={[styles.safeZone, { bottom: 50 }]}>
              <Text style={styles.safeZoneText}>↓ Safe placement area ↓</Text>
            </View>
          </View>

          {/* Furniture Image */}
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
                  borderWidth: 4,
                  opacity: isPlaced ? 0.9 : 0.7,
                  shadowColor: fits ? '#00FF00' : '#FF0000',
                  shadowOpacity: 0.5,
                  shadowRadius: 10,
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
              {!fits && (
                <View style={styles.warningOverlay}>
                  <Text style={styles.warningText}>⚠️</Text>
                </View>
              )}
            </View>
          )}
          
          {/* Status Bar */}
          <View style={styles.statusBar}>
            <View style={[styles.fitIndicator, { 
              backgroundColor: fits ? '#00FF00CC' : '#FF0000CC',
              borderColor: fits ? '#00FF00' : '#FF0000',
            }]}>
              <Text style={styles.fitText}>
                {fits 
                  ? '✓ Clear space - Furniture fits!' 
                  : '✗ Space blocked - Move to clear area'}
              </Text>
            </View>
            {selectedFurniture && (
              <View style={styles.infoBox}>
                <Text style={styles.dimensionsText}>
                  {selectedFurniture.name}
                </Text>
                <Text style={styles.dimensionsText}>
                  Size: {selectedFurniture.dimensions.width} × {selectedFurniture.dimensions.height} cm
                </Text>
                <Text style={styles.dimensionsText}>
                  Scale: {(furnitureScale * 100).toFixed(0)}%
                </Text>
                <Text style={styles.instructionText}>
                  {fits 
                    ? "✓ No obstacles detected here"
                    : "⚠️ Obstacle detected - try moving down"}
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
  obstacleZone: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 0, 0, 0.5)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  obstacleLabel: {
    color: 'rgba(255, 0, 0, 0.7)',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  placementGuide: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  safeZone: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  safeZoneText: {
    color: 'rgba(0, 255, 0, 0.8)',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  furnitureContainer: {
    position: 'absolute',
    borderRadius: 8,
    padding: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  warningOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 18,
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
    borderWidth: 3,
  },
  fitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  infoBox: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dimensionsText: {
    color: 'white',
    fontSize: 12,
    marginVertical: 2,
  },
  instructionText: {
    color: '#FFD700',
    fontSize: 12,
    marginTop: 5,
    fontWeight: 'bold',
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
  },
  resetText: {
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

export default SmartARViewer;