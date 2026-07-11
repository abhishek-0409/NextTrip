

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '../../constants/colors';
import { COLUMN_WIDTH, COLUMN_GAP } from './AddPackageSlot';

export interface CompareRowCellsProps {
  cells: React.ReactNode[];
  highlightIndex?: number | null;
  highlightColor?: string;
  minHeight?: number;
}


export function CompareRowCells({
  cells,
  highlightIndex = null,
  highlightColor = Colors.successLight,
  minHeight = 64,
}: CompareRowCellsProps): React.ReactElement {
  return (
    <View style={[styles.cellsRow, { minHeight }]}>
      {cells.map((cell, index) => (
        <View
          key={index}
          style={[
            styles.cell,
            { minHeight },
            index === highlightIndex && {
              backgroundColor: highlightColor,
            },
          ]}
        >
          {cell}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cellsRow: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    marginRight: COLUMN_GAP,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: COLUMN_WIDTH,
  },
});
