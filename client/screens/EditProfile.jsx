import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { global } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../store/slices/authSlice";
import { showToast } from "../store/slices/toastSlice";
import { useThemeColors, useThemedStyles } from "../styles/global"; 

const EditProfile = ({ navigation }) => {
  const dispatch = useDispatch();
  const {user, status, error} = useSelector((state) => state.auth);
  const { bgColor, textColor } = useThemeColors();
  const themedStyles = useThemedStyles();

  const [email, setEmail] = useState(user?.email || "");
  const [username, setUsername] = useState( user?.username || "");


  const handleSaveChanges = async () => {
    try {
      await dispatch(updateProfile({ email, username })).unwrap();
      dispatch(showToast({
        message: "Profile updated successfully!",
        type: "success",
      }));
      navigation.goBack();
    } catch (error) {
      dispatch(showToast({
        message: error || "Failed to update profile",
        type: "error",
      }));
      console.error("Profile update error:", error);
    }
  };

  return (
    <View style={[global.mainContainer, { backgroundColor: bgColor }]}>
      <Text style={themedStyles.label}>Username</Text>
      <TextInput
        style={themedStyles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <Text style={themedStyles.label}>Email</Text>
      <TextInput
        style={themedStyles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TouchableOpacity style={themedStyles.button1} onPress={handleSaveChanges}>
        <Text style={themedStyles.btnText1}>
          {status === "loading" ? "Updating..." : "Save Changes"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditProfile;
