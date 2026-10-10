import type { TextInputProps, TextProps } from "react-native";
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
} from "react-native";
import { font } from "../../design-system/tokens";

/** Shared typography primitives so all app copy uses the bundled SF Pro family. */
function fontFamilyForStyle(style: TextProps["style"] | TextInputProps["style"]) {
  const flattened = StyleSheet.flatten(style);
  if (flattened?.fontFamily) return flattened.fontFamily;

  const weight = Number(flattened?.fontWeight);
  if (weight >= 700 || flattened?.fontWeight === "bold") return font.family.bold;
  if (weight >= 600) return font.family.semibold;
  if (weight >= 500) return font.family.medium;
  return font.family.regular;
}

export function AppText({ style, ...props }: TextProps) {
  return (
    <NativeText {...props} style={[style, { fontFamily: fontFamilyForStyle(style) }]} />
  );
}

export function AppTextInput({ style, ...props }: TextInputProps) {
  return (
    <NativeTextInput
      {...props}
      style={[style, { fontFamily: fontFamilyForStyle(style) }]}
    />
  );
}
