import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import FurnitureSelector from './src/components/FurnitureSelector';
import CloudVisionARViewer from './src/components/CloudVisionARViewer';
import { FurnitureModel } from './src/models/FurnitureModels';

export default function App() {
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureModel | null>(null);
  const [furnitureImage, setFurnitureImage] = useState<string | undefined>(undefined);
  const [showAR, setShowAR] = useState(false);

  const handleSelectFurniture = (furniture: FurnitureModel, image?: string) => {
    setSelectedFurniture(furniture);
    setFurnitureImage(image);
    setShowAR(true);
  };

  const handleBack = () => {
    setShowAR(false);
    setSelectedFurniture(null);
    setFurnitureImage(undefined);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      {showAR ? (
        <CloudVisionARViewer
          selectedFurniture={selectedFurniture}
          furnitureImage={furnitureImage}
          onBack={handleBack}
        />
      ) : (
        <FurnitureSelector
          onSelectFurniture={handleSelectFurniture}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
