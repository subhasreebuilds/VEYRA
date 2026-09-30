import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");

// Design tokens
const COLOR_BG = "#F9F6F0";
const COLOR_PRIMARY = "#2D3A2F";
const COLOR_CARD = "#FFF";
const COLOR_MUTED = "#A3B899";
const COLOR_TEXT_MUTED = "#6B7A68";
const COLOR_ACCENT = "#E6E1D8";

type Step =
  | "intro"
  | "camera"
  | "analyzing"
  | "results"
  | "recommendations"
  | "ready";

export default function SkinScreen() {
  const [currentStep, setCurrentStep] = useState<Step>("intro");
  const [activeTab, setActiveTab] = useState("All");

  // Fade animation for analyzing screen
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentStep === "analyzing") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      const timer = setTimeout(() => {
        setCurrentStep("results");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const renderHeader = (title: string, showBack: boolean = true) => (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity
          onPress={() => setCurrentStep("intro")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLOR_PRIMARY} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  const renderIntro = () => (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.introContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>Healthy skin{"\n"}starts with you</Text>
        <Text style={styles.subTitle}>
          Upload a clear photo of your face and let our AI analyze your skin
          health, type and personalized care routine.
        </Text>

        <View style={styles.illustrationContainer}>
          <View style={styles.illustrationBox}>
            <Image
              source={require("../../../../assets/images/dash_face_portrait.jpg")}
              style={styles.illustrationImage}
            />
            {/* Scan Brackets */}
            <View style={[styles.bracket, styles.bracketTL]} />
            <View style={[styles.bracket, styles.bracketTR]} />
            <View style={[styles.bracket, styles.bracketBL]} />
            <View style={[styles.bracket, styles.bracketBR]} />

            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (perm.granted) {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.5,
              });
              if (!result.canceled) {
                setCurrentStep("analyzing");
              }
            } else {
              alert("Camera permission is required!");
            }
          }}
        >
          <Text style={styles.primaryButtonText}>Take Photo</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          For best results, use good lighting{"\n"}and a clear, front-facing
          photo.
        </Text>
      </ScrollView>
    </View>
  );

  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      <View style={styles.cameraHeader}>
        <TouchableOpacity onPress={() => setCurrentStep("intro")}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.cameraTitle}>Skin Analysis</Text>
        <TouchableOpacity>
          <Ionicons name="flash-off" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <CameraView style={styles.cameraPreview} facing="front">
        {/* Large Brackets */}
        <View
          style={[styles.bracketLg, styles.bracketTL, { borderColor: "#FFF" }]}
        />
        <View
          style={[styles.bracketLg, styles.bracketTR, { borderColor: "#FFF" }]}
        />
        <View
          style={[styles.bracketLg, styles.bracketBL, { borderColor: "#FFF" }]}
        />
        <View
          style={[styles.bracketLg, styles.bracketBR, { borderColor: "#FFF" }]}
        />
      </CameraView>

      <View style={styles.cameraControls}>
        <View style={styles.cameraModes}>
          <Text style={styles.cameraModeActive}>Photo</Text>
          <Text style={styles.cameraModeInactive}>Video</Text>
        </View>
        <View style={styles.cameraActions}>
          <TouchableOpacity onPress={() => setCurrentStep("intro")}>
            <Ionicons name="image" size={32} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.captureButtonOuter}
            onPress={() => setCurrentStep("analyzing")}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="camera-reverse" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderAnalyzing = () => (
    <View style={styles.container}>
      {renderHeader("Skin Analysis")}
      <View style={styles.analyzingContent}>
        <Animated.View style={[styles.loadingCircle, { opacity: fadeAnim }]}>
          <Ionicons name="leaf" size={48} color={COLOR_PRIMARY} />
        </Animated.View>
        <Text style={styles.analyzingTitle}>Analyzing your skin...</Text>
        <Text style={styles.analyzingSub}>
          Our AI is detecting your skin type, concerns and personalized care
          recommendations.
        </Text>

        <View style={styles.checklist}>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark" size={20} color={COLOR_PRIMARY} />
            <Text style={styles.checkText}>Analyzing skin features</Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark" size={20} color={COLOR_PRIMARY} />
            <Text style={styles.checkText}>Detecting skin type</Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark" size={20} color={COLOR_PRIMARY} />
            <Text style={styles.checkText}>Identifying concerns</Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark" size={20} color={COLOR_MUTED} />
            <Text style={styles.checkText}>Preparing recommendations</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderResults = () => (
    <View style={styles.container}>
      {renderHeader("Skin Analysis")}
      <ScrollView
        contentContainerStyle={styles.scrollPadding}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultsTop}>
          <Image
            source={require("../../../../assets/images/dash_face_portrait.jpg")}
            style={styles.resultsPhoto}
          />
          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>78</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <Text style={styles.scoreLabel}>Skin Health</Text>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>Combination Skin</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Skin Overview</Text>
        <Text style={styles.overviewText}>
          Your skin appears to be combination type, with more visible oiliness
          around the T-zone and mild uneven tone. There are also some signs of
          dehydration and visible pores.
        </Text>

        <Text style={styles.sectionTitle}>Visible Characteristics</Text>
        <View style={styles.pillContainer}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Slight oiliness (T-zone)</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Enlarged pores</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Mild uneven tone</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Slight dehydration</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Concerns</Text>
        <View style={styles.concernsList}>
          <View style={styles.concernItem}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[styles.dot, { backgroundColor: "#A78BFA" }]} />
              <Text style={styles.concernName}>Visible pores</Text>
            </View>
            <Text style={styles.concernLevel}>Mild</Text>
          </View>
          <View style={styles.concernItem}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[styles.dot, { backgroundColor: "#F472B6" }]} />
              <Text style={styles.concernName}>Uneven skin tone</Text>
            </View>
            <Text style={styles.concernLevel}>Mild</Text>
          </View>
          <View style={styles.concernItem}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[styles.dot, { backgroundColor: "#FCD34D" }]} />
              <Text style={styles.concernName}>Dehydration appearance</Text>
            </View>
            <Text style={styles.concernLevel}>Mild</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setCurrentStep("recommendations")}
        >
          <Ionicons
            name="sparkles"
            size={16}
            color="#FFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.primaryButtonText}>Generate Recommendations</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderRecommendations = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setCurrentStep("results")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLOR_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommendations</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsContainer}>
        {["All", "Products", "Home Care", "Lifestyle"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === tab && styles.tabBtnTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollPadding}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>For Your Skin</Text>

        {/* Mock Product 1 */}
        <TouchableOpacity style={styles.productCard}>
          <View style={styles.productImgMock}>
            <Ionicons name="water" size={32} color={COLOR_PRIMARY} />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productType}>Face Wash</Text>
            <Text style={styles.productName}>Gentle low-foam cleanser</Text>
            <Text style={styles.productDesc}>
              Helps remove excess oil without stripping the skin.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLOR_MUTED} />
        </TouchableOpacity>

        {/* Mock Product 2 */}
        <TouchableOpacity style={styles.productCard}>
          <View style={styles.productImgMock}>
            <Ionicons name="flower" size={32} color={COLOR_PRIMARY} />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productType}>Moisturizer</Text>
            <Text style={styles.productName}>Lightweight gel moisturizer</Text>
            <Text style={styles.productDesc}>
              Supports hydration and maintains the skin barrier.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLOR_MUTED} />
        </TouchableOpacity>

        {/* Mock Product 3 */}
        <TouchableOpacity style={styles.productCard}>
          <View style={styles.productImgMock}>
            <Ionicons name="sunny" size={32} color="#F59E0B" />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productType}>Sunscreen</Text>
            <Text style={styles.productName}>Broad-spectrum SPF 50</Text>
            <Text style={styles.productDesc}>
              Protects against UV damage and helps prevent uneven tone.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLOR_MUTED} />
        </TouchableOpacity>

        {/* Mock Product 4 */}
        <TouchableOpacity style={styles.productCard}>
          <View style={styles.productImgMock}>
            <Ionicons name="flask" size={32} color="#78716C" />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productType}>Serum</Text>
            <Text style={styles.productName}>Niacinamide serum</Text>
            <Text style={styles.productDesc}>
              Helps with pores, uneven tone and skin texture.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLOR_MUTED} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: currentStep === "camera" ? "#000" : COLOR_BG,
      }}
    >
      {currentStep === "intro" && renderIntro()}
      {currentStep === "analyzing" && renderAnalyzing()}
      {currentStep === "results" && renderResults()}
      {currentStep === "recommendations" && renderRecommendations()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR_BG },
  scrollPadding: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12 },

  // Headers
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoText: {
    fontFamily: "serif",
    fontSize: 24,
    fontWeight: "bold",
    color: COLOR_PRIMARY,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: COLOR_PRIMARY },
  backButton: { padding: 4 },

  // Intro Screen
  introContent: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 },
  mainTitle: {
    fontFamily: "serif",
    fontSize: 36,
    fontWeight: "bold",
    color: COLOR_PRIMARY,
    lineHeight: 42,
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 16,
    color: COLOR_TEXT_MUTED,
    lineHeight: 24,
    marginBottom: 32,
  },
  illustrationContainer: { alignItems: "center", marginBottom: 40 },
  illustrationBox: {
    width: 220,
    height: 260,
    backgroundColor: "#EFEBE2",
    borderRadius: 120,
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
    position: "relative",
  },
  illustrationImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.9,
  },
  bracket: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: COLOR_PRIMARY,
    borderWidth: 2,
  },
  bracketTL: {
    top: 20,
    left: 20,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  bracketTR: {
    top: 20,
    right: 20,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bracketBL: {
    bottom: 20,
    left: 20,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bracketBR: {
    bottom: 20,
    right: 20,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 10,
    right: 30,
    backgroundColor: COLOR_PRIMARY,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLOR_BG,
  },

  // Buttons
  primaryButton: {
    backgroundColor: COLOR_PRIMARY,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  secondaryButton: {
    backgroundColor: "#FFF",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8DCD2",
    marginBottom: 32,
    flexDirection: "row",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: COLOR_PRIMARY,
    fontSize: 16,
    fontWeight: "600",
  },
  footerNote: {
    textAlign: "center",
    color: COLOR_TEXT_MUTED,
    fontSize: 13,
    lineHeight: 20,
  },

  // Camera Mock
  cameraContainer: { flex: 1, backgroundColor: COLOR_PRIMARY },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  cameraTitle: { color: "#FFF", fontSize: 18, fontWeight: "600" },
  cameraPreview: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  cameraImage: { width: "100%", height: "100%", opacity: 0.8 },
  bracketLg: {
    position: "absolute",
    width: 40,
    height: 40,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  cameraControls: {
    backgroundColor: COLOR_PRIMARY,
    paddingBottom: 40,
    paddingTop: 20,
    paddingHorizontal: 40,
  },
  cameraModes: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
    gap: 24,
  },
  cameraModeActive: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    borderBottomWidth: 2,
    borderBottomColor: "#FFF",
    paddingBottom: 4,
  },
  cameraModeInactive: { color: COLOR_MUTED, fontSize: 16, fontWeight: "600" },
  cameraActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  captureButtonOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF",
  },

  // Analyzing
  analyzingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#EFEBE2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  analyzingTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLOR_PRIMARY,
    marginBottom: 16,
  },
  analyzingSub: {
    textAlign: "center",
    color: COLOR_TEXT_MUTED,
    lineHeight: 22,
    marginBottom: 48,
  },
  checklist: {
    width: "100%",
    backgroundColor: "#F2EFE8",
    padding: 24,
    borderRadius: 16,
    gap: 16,
  },
  checkItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkText: { fontSize: 15, color: COLOR_PRIMARY, fontWeight: "500" },

  // Results
  resultsTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 20,
  },
  resultsPhoto: { width: width * 0.35, height: width * 0.45, borderRadius: 24 },
  scoreContainer: { flex: 1, alignItems: "center" },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: COLOR_PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  scoreNumber: { fontSize: 32, fontWeight: "bold", color: COLOR_PRIMARY },
  scoreMax: { fontSize: 12, color: COLOR_TEXT_MUTED, marginTop: -4 },
  scoreLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLOR_PRIMARY,
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: COLOR_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: { color: "#FFF", fontSize: 12, fontWeight: "600" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLOR_PRIMARY,
    marginBottom: 12,
    marginTop: 8,
  },
  overviewText: {
    fontSize: 14,
    color: COLOR_TEXT_MUTED,
    lineHeight: 22,
    marginBottom: 24,
  },

  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    backgroundColor: "#EFEBE2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: { fontSize: 12, color: COLOR_PRIMARY, fontWeight: "500" },

  concernsList: { gap: 12, marginBottom: 32 },
  concernItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  concernName: { fontSize: 14, color: COLOR_TEXT_MUTED },
  concernLevel: { fontSize: 14, fontWeight: "600", color: COLOR_PRIMARY },

  // Recommendations
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#EFEBE2",
  },
  tabBtnActive: { backgroundColor: COLOR_PRIMARY },
  tabBtnText: { fontSize: 13, fontWeight: "600", color: COLOR_PRIMARY },
  tabBtnTextActive: { color: "#FFF" },

  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  productImgMock: {
    width: 60,
    height: 60,
    backgroundColor: "#F9F6F0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  productInfo: { flex: 1, marginRight: 12 },
  productType: {
    fontSize: 12,
    fontWeight: "600",
    color: COLOR_PRIMARY,
    marginBottom: 4,
  },
  productName: { fontSize: 13, color: COLOR_TEXT_MUTED, marginBottom: 4 },
  productDesc: { fontSize: 11, color: "#A3B899", lineHeight: 16 },
});
