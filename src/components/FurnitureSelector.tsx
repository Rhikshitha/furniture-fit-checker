import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FurnitureModel, furniturePresets } from '../models/FurnitureModels';

interface FurnitureSelectorProps {
  onSelectFurniture: (furniture: FurnitureModel, image?: string) => void;
}

const FurnitureSelector: React.FC<FurnitureSelectorProps> = ({ onSelectFurniture }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [customDimensions, setCustomDimensions] = useState({
    width: '100',
    height: '100',
    depth: '50'
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri);
    }
  };

  const handleSelectFurniture = (furniture: FurnitureModel) => {
    onSelectFurniture(furniture, undefined);
  };

  const createCustomFurniture = () => {
    if (!uploadedImage) {
      Alert.alert('Please upload an image first');
      return;
    }

    const customFurniture: FurnitureModel = {
      id: 'custom-1',
      name: 'Custom Furniture',
      type: 'sofa',
      dimensions: {
        width: parseFloat(customDimensions.width) || 100,
        height: parseFloat(customDimensions.height) || 100,
        depth: parseFloat(customDimensions.depth) || 100
      },
      color: '#4B0082',
      createGeometry: () => null as any
    };

    onSelectFurniture(customFurniture, uploadedImage);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Furniture AR Viewer</Text>
      <Text style={styles.subtitle}>Check if furniture fits in your space!</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload Your Furniture Image</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.uploadButtonText}>📷 Choose from Gallery</Text>
        </TouchableOpacity>
        
        {uploadedImage && (
          <View style={styles.uploadedSection}>
            <Image source={{ uri: uploadedImage }} style={styles.uploadedImage} />
            <Text style={styles.dimensionsTitle}>Enter Actual Dimensions (cm)</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Width:</Text>
                <TextInput
                  style={styles.input}
                  value={customDimensions.width}
                  onChangeText={(text) => setCustomDimensions({...customDimensions, width: text})}
                  keyboardType="numeric"
                  placeholder="100"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height:</Text>
                <TextInput
                  style={styles.input}
                  value={customDimensions.height}
                  onChangeText={(text) => setCustomDimensions({...customDimensions, height: text})}
                  keyboardType="numeric"
                  placeholder="100"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Depth:</Text>
                <TextInput
                  style={styles.input}
                  value={customDimensions.depth}
                  onChangeText={(text) => setCustomDimensions({...customDimensions, depth: text})}
                  keyboardType="numeric"
                  placeholder="50"
                />
              </View>
            </View>
            <TouchableOpacity style={styles.viewARButton} onPress={createCustomFurniture}>
              <Text style={styles.viewARButtonText}>🎯 Check Fit in AR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Or Try Preset Furniture</Text>
        <View style={styles.furnitureGrid}>
          {furniturePresets.map((furniture) => (
            <TouchableOpacity
              key={furniture.id}
              style={styles.furnitureCard}
              onPress={() => handleSelectFurniture(furniture)}
            >
              <View style={[styles.furniturePreview, { backgroundColor: furniture.color }]} />
              <Text style={styles.furnitureName}>{furniture.name}</Text>
              <Text style={styles.furnitureDimensions}>
                {furniture.dimensions.width} × {furniture.dimensions.height} × {furniture.dimensions.depth} cm
              </Text>
              <TouchableOpacity 
                style={styles.cardARButton}
                onPress={() => handleSelectFurniture(furniture)}
              >
                <Text style={styles.cardARButtonText}>View in AR</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.howItWorks}>
        <Text style={styles.howItWorksTitle}>How it works:</Text>
        <Text style={styles.howItWorksText}>1. Upload furniture image or select preset</Text>
        <Text style={styles.howItWorksText}>2. Point camera at your space</Text>
        <Text style={styles.howItWorksText}>3. Drag to position, scale to size</Text>
        <Text style={styles.howItWorksText}>4. Green border = fits | Red = doesn't fit</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#555',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadedSection: {
    marginTop: 15,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
    resizeMode: 'contain',
    backgroundColor: '#f9f9f9',
  },
  dimensionsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#555',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  viewARButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  viewARButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  furnitureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  furnitureCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  furniturePreview: {
    width: '100%',
    height: 80,
    borderRadius: 5,
    marginBottom: 8,
  },
  furnitureName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  furnitureDimensions: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardARButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  cardARButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  howItWorks: {
    backgroundColor: '#e8f4f8',
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  howItWorksText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
});

export default FurnitureSelector;