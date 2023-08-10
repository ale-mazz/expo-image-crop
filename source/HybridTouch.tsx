import React from "react";
import {
  Platform,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  onPress: () => void;
  style: any;
  children: React.ReactNode;
}

const HybridTouch = ({ onPress, style, children }: Props) =>
  Platform.OS === "android" ? (
    <TouchableNativeFeedback onPress={onPress}>
      <View style={style}>{children}</View>
    </TouchableNativeFeedback>
  ) : (
    <TouchableOpacity onPress={onPress} style={style}>
      {children}
    </TouchableOpacity>
  );

export default HybridTouch;
