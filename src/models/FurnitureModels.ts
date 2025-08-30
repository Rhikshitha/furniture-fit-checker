import * as THREE from 'three';

export interface FurnitureModel {
  id: string;
  name: string;
  type: 'sofa' | 'table' | 'shelf';
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  color: string;
  createGeometry: () => THREE.BoxGeometry;
}

export const furniturePresets: FurnitureModel[] = [
  {
    id: 'sofa-1',
    name: '3-Seater Sofa',
    type: 'sofa',
    dimensions: {
      width: 200,  // cm
      height: 85,
      depth: 90
    },
    color: '#8B4513',
    createGeometry: () => new THREE.BoxGeometry(2, 0.85, 0.9)
  },
  {
    id: 'table-1',
    name: 'Dining Table',
    type: 'table',
    dimensions: {
      width: 160,
      height: 75,
      depth: 90
    },
    color: '#654321',
    createGeometry: () => new THREE.BoxGeometry(1.6, 0.75, 0.9)
  },
  {
    id: 'shelf-1',
    name: 'Bookshelf',
    type: 'shelf',
    dimensions: {
      width: 80,
      height: 180,
      depth: 35
    },
    color: '#A0522D',
    createGeometry: () => new THREE.BoxGeometry(0.8, 1.8, 0.35)
  },
  {
    id: 'sofa-2',
    name: '2-Seater Sofa',
    type: 'sofa',
    dimensions: {
      width: 150,
      height: 85,
      depth: 90
    },
    color: '#696969',
    createGeometry: () => new THREE.BoxGeometry(1.5, 0.85, 0.9)
  },
  {
    id: 'table-2',
    name: 'Coffee Table',
    type: 'table',
    dimensions: {
      width: 120,
      height: 45,
      depth: 60
    },
    color: '#8B7355',
    createGeometry: () => new THREE.BoxGeometry(1.2, 0.45, 0.6)
  }
];

export const getRoomBounds = (roomDimensions: { width: number; height: number; depth: number }) => {
  return {
    minX: -roomDimensions.width / 200,
    maxX: roomDimensions.width / 200,
    minY: 0,
    maxY: roomDimensions.height / 100,
    minZ: -roomDimensions.depth / 200,
    maxZ: roomDimensions.depth / 200
  };
};

export const checkFit = (
  furnitureModel: FurnitureModel,
  position: THREE.Vector3,
  roomDimensions: { width: number; height: number; depth: number }
): boolean => {
  const bounds = getRoomBounds(roomDimensions);
  const halfWidth = furnitureModel.dimensions.width / 200;
  const halfHeight = furnitureModel.dimensions.height / 200;
  const halfDepth = furnitureModel.dimensions.depth / 200;

  const fits = 
    position.x - halfWidth >= bounds.minX &&
    position.x + halfWidth <= bounds.maxX &&
    position.y >= bounds.minY &&
    position.y + halfHeight <= bounds.maxY &&
    position.z - halfDepth >= bounds.minZ &&
    position.z + halfDepth <= bounds.maxZ;

  return fits;
};