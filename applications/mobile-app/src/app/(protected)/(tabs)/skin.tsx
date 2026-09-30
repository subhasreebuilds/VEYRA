import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { useFocusEffect } from "expo-router";
import { api } from "../../../lib/api";

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
  | "analyzing"
  | "results"
  | "recommendations";

interface SkinConcern {
  name: string;
  level: string;
  color: string;
}

interface SkinAnalysisData {
  score: number;
  skinType: string;
  overview: string;
  characteristics: string[];
  concerns: SkinConcern[];
  photoUri: any;
}

type GenerationState = "NOT_GENERATED" | "GENERATING" | "GENERATED" | "ERROR";

export default function SkinScreen() {
  const [currentStep, setCurrentStep] = useState<Step>("intro");
  const [activeTab, setActiveTab] = useState("All");
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<SkinAnalysisData | null>(null);
  
  const [generationState, setGenerationState] = useState<GenerationState>("NOT_GENERATED");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);

  // Fade animation for analyzing screen
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load history on focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadLatestScan() {
        try {
          const res = await api.get('/skin-analysis/history');
          if (res.data && res.data.length > 0) {
            const latest = res.data[0];
            
            if (!isActive) return;

            setAnalysisData({
              score: latest.overallScore || 0,
              skinType: "Combination Skin",
              overview: latest.summary || "No overview available.",
              characteristics: (latest.metrics || []).map((m: any) => `${m.name}: ${m.status}`),
              concerns: (latest.concerns || []).map((c: any) => ({
                name: c.name,
                level: c.level || 'Mild',
                color: c.color || '#FBBF6C'
              })),
              photoUri: require("../../../../assets/images/dash_face_portrait.jpg"),
            });
            
            // Check for recommendations
            const recRes = await api.get('/skin-analysis/latest/recommendations');
            if (recRes.data && recRes.data.length > 0) {
              setRecommendations(recRes.data);
              setGenerationState("GENERATED");
            } else {
              setGenerationState("NOT_GENERATED");
            }
            
            // Only auto-navigate to results if we are on intro
            setCurrentStep(prev => prev === "intro" ? "results" : prev);
          }
        } catch (err) {
          console.error("Error loading latest scan:", err);
        }
      }
      
      loadLatestScan();

      return () => {
        isActive = false;
      };
    }, [])
  );

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

      async function processScan() {
        try {
          if (!capturedImageBase64) throw new Error("No image data");
          
          const response = await api.post('/skin-analysis/scan', {
            image: `data:image/jpeg;base64,${capturedImageBase64}`
          });
          
          const latest = response.data;
          
          setAnalysisData({
            score: latest.overallScore || 0,
            skinType: "Combination Skin",
            overview: latest.summary || "No overview available.",
            characteristics: (latest.metrics || []).map((m: any) => `${m.name}: ${m.status}`),
            concerns: (latest.concerns || []).map((c: any) => ({
              name: c.name,
              level: c.level || 'Mild',
              color: c.color || '#FBBF6C'
            })),
            photoUri: { uri: capturedImageUri },
          });
          
          setGenerationState("NOT_GENERATED");
          setRecommendations([]);
          setCurrentStep("results");
        } catch (err) {
          console.error("Scan failed:", err);
          // Revert to intro on error
          alert("Failed to analyze skin. Please try again.");
          setCurrentStep("intro");
        }
      }
      
      processScan();
    }
  }, [currentStep, capturedImageUri, capturedImageBase64]);

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
                base64: true,
              });
              if (!result.canceled) {
                setCapturedImageUri(result.assets[0].uri);
                setCapturedImageBase64(result.assets[0].base64 || null);
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



  const renderAnalyzing = () => (
    <View style={styles.container}>
      {renderHeader("Skin Analysis")}
      <View style={styles.analyzingContent}>
        <View style={styles.loadingCircleContainer}>
          <Ionicons name="sparkles" size={18} color="#EBB17B" style={{ position: "absolute", top: -10, right: -15 }} />
          <Ionicons name="sparkles" size={12} color="#EBB17B" style={{ position: "absolute", top: 30, right: -30 }} />
          <Ionicons name="sparkles" size={14} color="#E6E1D8" style={{ position: "absolute", bottom: 20, left: -25 }} />
          
          <Animated.View style={[styles.loadingCircle, { opacity: fadeAnim }]}>
            <Ionicons name="leaf" size={54} color={COLOR_PRIMARY} />
          </Animated.View>
        </View>
        
        <Text style={styles.analyzingTitle}>Analyzing your skin...</Text>
        <Text style={styles.analyzingSub}>
          Our AI is detecting your skin type, concerns and personalized care
          recommendations.
        </Text>

        <View style={styles.checklist}>
          <View style={styles.checkItem}>
            <View style={styles.checkCircleActive}>
              <Ionicons name="checkmark" size={14} color={COLOR_PRIMARY} />
            </View>
            <Text style={styles.checkText}>Analyzing skin features</Text>
          </View>
          <View style={styles.checkItem}>
            <View style={styles.checkCircleActive}>
              <Ionicons name="checkmark" size={14} color={COLOR_PRIMARY} />
            </View>
            <Text style={styles.checkText}>Detecting skin type</Text>
          </View>
          <View style={styles.checkItem}>
            <View style={styles.checkCircleActive}>
              <Ionicons name="checkmark" size={14} color={COLOR_PRIMARY} />
            </View>
            <Text style={styles.checkText}>Identifying concerns</Text>
          </View>
          <View style={styles.checkItem}>
            <View style={styles.checkCircleActive}>
              <Ionicons name="checkmark" size={14} color={COLOR_PRIMARY} />
            </View>
            <Text style={styles.checkText}>Preparing recommendations</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const handleGenerateRecommendations = async () => {
    if (generationState === "GENERATING" || generationState === "GENERATED") return;
    
    setGenerationState("GENERATING");
    try {
      await api.post('/skin-analysis/latest/recommendations/generate');
      
      const recRes = await api.get('/skin-analysis/latest/recommendations');
      setRecommendations(recRes.data || []);
      setGenerationState("GENERATED");
      
      // Auto-navigate to recommendations after a short delay
      setTimeout(() => {
        setCurrentStep("recommendations");
      }, 1000);
    } catch (err) {
      console.error("Error generating recommendations:", err);
      setGenerationState("ERROR");
    }
  };

  const renderResults = () => (
    <View style={styles.container}>
      {renderHeader("Skin Analysis", false)}
      <ScrollView
        contentContainerStyle={[styles.scrollPadding, { gap: 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.resultCard, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
          <Image
            source={analysisData?.photoUri}
            style={styles.resultsPhoto}
          />
          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <View style={styles.scoreTextWrapper}>
                <Text style={styles.scoreNumber}>{analysisData?.score}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
            </View>
            <Text style={styles.scoreLabel}>Skin Health</Text>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{analysisData?.skinType}</Text>
            </View>
          </View>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.cardTitle}>Skin Overview</Text>
          <Text style={styles.overviewText}>
            {analysisData?.overview}
          </Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.cardTitle}>Visible Characteristics</Text>
          <View style={styles.pillContainer}>
            {analysisData?.characteristics.map((char, idx) => (
              <View key={idx} style={styles.pill}>
                <Text style={styles.pillText}>{char}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.cardTitle}>Your Concerns</Text>
          <View style={styles.concernsList}>
            {analysisData?.concerns.map((concern, idx) => (
              <View key={idx} style={styles.concernItemRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={[styles.dot, { backgroundColor: concern.color }]} />
                  <Text style={styles.concernName}>{concern.name}</Text>
                </View>
                <Text style={styles.concernLevel}>{concern.level}</Text>
              </View>
            ))}
          </View>
        </View>

        {generationState === "NOT_GENERATED" || generationState === "ERROR" ? (
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 8 }]}
            onPress={handleGenerateRecommendations}
          >
            <Ionicons name="sparkles" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Generate Recommendations</Text>
          </TouchableOpacity>
        ) : generationState === "GENERATING" ? (
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 8, opacity: 0.7 }]}
            disabled={true}
          >
            <Ionicons name="sparkles" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Generating Recommendations...</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 8, backgroundColor: COLOR_MUTED }]}
              disabled={true}
            >
              <Ionicons name="checkmark" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Recommendations Generated</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 12, backgroundColor: "transparent", borderWidth: 1, borderColor: COLOR_PRIMARY }]}
              onPress={() => setCurrentStep("recommendations")}
            >
              <Text style={[styles.primaryButtonText, { color: COLOR_PRIMARY }]}>View Recommendations</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={{ marginTop: 24, padding: 12, alignItems: 'center' }}
          onPress={() => setCurrentStep("intro")}
        >
          <Text style={{ fontSize: 14, color: COLOR_TEXT_MUTED, fontWeight: '500' }}>
            Want a fresh analysis? Take a new scan
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderRecommendationCard = (rec: any, defaultIcon: any, color: string, bgColor?: string) => {
    let iconName = defaultIcon;
    let iconColor = color;
    let iconBgColor = bgColor || "#F9F6F0";
    let isProduct = rec.category === 'SKINCARE' || rec.category === 'HOME_CARE';
    let imageUrl = "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=200&auto=format&fit=crop";
    
    const typeUpper = (rec.recommendationType || rec.title || "").toUpperCase();
    
    if (typeUpper.includes("WASH") || typeUpper.includes("CLEANS")) {
      imageUrl = "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=200&auto=format&fit=crop";
    }
    else if (typeUpper.includes("MOISTURIZ") || typeUpper.includes("CREAM")) {
      imageUrl = "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=200&auto=format&fit=crop";
    }
    else if (typeUpper.includes("SUN") || typeUpper.includes("SPF")) {
      imageUrl = "https://images.unsplash.com/photo-1526366003456-b6a2569fd65e?q=80&w=200&auto=format&fit=crop";
    }
    else if (typeUpper.includes("SERUM") || typeUpper.includes("ACID")) {
      imageUrl = "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=200&auto=format&fit=crop";
    }
    else if (typeUpper.includes("MASK") || typeUpper.includes("COMPRESS")) {
      imageUrl = "https://images.unsplash.com/photo-1596755389378-c11ddece8dc7?q=80&w=200&auto=format&fit=crop";
    }
    else if (typeUpper.includes("HYDRAT") || typeUpper.includes("WATER") || typeUpper.includes("DRINK")) {
      iconName = "water";
      iconColor = "#4DA6FF";
      iconBgColor = "#E3F2FD";
      isProduct = false;
    }
    else if (typeUpper.includes("SLEEP") || typeUpper.includes("REST")) {
      iconName = "moon";
      iconColor = "#9575CD";
      iconBgColor = "#EDE7F6";
      isProduct = false;
    }
    else if (typeUpper.includes("STRESS") || typeUpper.includes("BREATH")) {
      iconName = "flower";
      iconColor = "#F06292";
      iconBgColor = "#FCE4EC";
      isProduct = false;
    }
    else if (typeUpper.includes("TOUCH")) {
      iconName = "close-circle";
      iconColor = "#E57373";
      iconBgColor = "#FFEBEE";
      isProduct = false;
    }
    else if (typeUpper.includes("FRUIT") || typeUpper.includes("VEG")) {
      iconName = "nutrition";
      iconColor = "#FF9800";
      iconBgColor = "#FFF3E0";
      isProduct = false;
    }
    else if (typeUpper.includes("PROTEIN")) {
      iconName = "briefcase";
      iconColor = "#415A42";
      iconBgColor = "#E8EFE6";
      isProduct = false;
    }
    else {
      // Default icon styling for non-products
      if (!isProduct) {
        iconName = defaultIcon;
        iconColor = color;
        iconBgColor = bgColor || "#F9F6F0";
      }
    }
    
    const isExpanded = expandedRecId === (rec.id || rec.title);
    
    let parsedInstructions: any = null;
    if (rec.instructions) {
      try {
        parsedInstructions = JSON.parse(rec.instructions);
      } catch (e) {
        parsedInstructions = { text: rec.instructions };
      }
    }

    return (
      <TouchableOpacity 
        key={rec.id || rec.title} 
        style={[styles.productCard, isExpanded && { flexDirection: 'column', alignItems: 'stretch' }]}
        onPress={() => setExpandedRecId(isExpanded ? null : (rec.id || rec.title))}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isProduct ? (
            <View style={styles.productImgMock}>
              <Image source={{ uri: imageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            </View>
          ) : (
            <View style={[styles.productImgMock, { backgroundColor: iconBgColor, borderRadius: 30 }]}>
              <Ionicons name={iconName} size={24} color={iconColor} />
            </View>
          )}
          
          <View style={styles.productInfo}>
            <Text style={styles.productType}>{rec.recommendationType || "Recommendation"}</Text>
            <Text style={styles.productName}>{rec.title}</Text>
            {!isExpanded && (
              <Text style={styles.productDesc} numberOfLines={2}>{rec.description || rec.reason}</Text>
            )}
          </View>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-forward"} size={16} color="#BDBDBD" />
        </View>

        {isExpanded && (
          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: "#F4F1EA", paddingTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: COLOR_PRIMARY, marginBottom: 4 }}>Why use this?</Text>
            <Text style={{ fontSize: 14, color: COLOR_TEXT_MUTED, lineHeight: 22 }}>
              {rec.reason || rec.description || "This recommendation was specifically tailored for your skin profile based on our clinical AI analysis."}
            </Text>
            
            {parsedInstructions && parsedInstructions.name && (
              <>
                <Text style={{ fontSize: 14, fontWeight: "600", color: COLOR_PRIMARY, marginTop: 12, marginBottom: 4 }}>Recommended Product:</Text>
                <Text style={{ fontSize: 14, color: COLOR_TEXT_MUTED, lineHeight: 22 }}>
                  <Text style={{ fontWeight: "700" }}>{parsedInstructions.brand}</Text> {parsedInstructions.name}
                </Text>
                {parsedInstructions.price && parsedInstructions.price !== 'N/A' && (
                  <Text style={{ fontSize: 13, color: COLOR_TEXT_MUTED, marginTop: 2 }}>
                    Est. Price: {parsedInstructions.price}
                  </Text>
                )}
              </>
            )}

            {parsedInstructions && parsedInstructions.text && (
              <>
                <Text style={{ fontSize: 14, fontWeight: "600", color: COLOR_PRIMARY, marginTop: 12, marginBottom: 4 }}>How to use:</Text>
                <Text style={{ fontSize: 14, color: COLOR_TEXT_MUTED, lineHeight: 22 }}>{parsedInstructions.text}</Text>
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderRecommendations = () => {
    const skincareRecs = recommendations.filter(r => r.category === 'SKINCARE');
    const homeCareRecs = recommendations.filter(r => r.category === 'HOME_CARE');
    const lifestyleRecs = recommendations.filter(r => r.category === 'LIFESTYLE');
    const dietRecs = recommendations.filter(r => r.category === 'DIET');

    return (
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
          contentContainerStyle={[styles.scrollPadding, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {(activeTab === "All" || activeTab === "Products") && (
            <>
              <Text style={styles.sectionTitle}>For Your Skin</Text>
              {skincareRecs.length > 0 ? (
                skincareRecs.map(rec => renderRecommendationCard(rec, "leaf", COLOR_PRIMARY))
              ) : (
                <Text style={{ color: COLOR_TEXT_MUTED, marginTop: 8 }}>No products recommended.</Text>
              )}
            </>
          )}

          {activeTab === "Home Care" && (
            <>
              <Text style={styles.sectionTitle}>Treatments & Routine</Text>
              {homeCareRecs.length > 0 ? (
                homeCareRecs.map(rec => renderRecommendationCard(rec, "home", "#78716C"))
              ) : (
                <Text style={{ color: COLOR_TEXT_MUTED, marginTop: 8 }}>No home care tips recommended.</Text>
              )}
            </>
          )}

          {activeTab === "Lifestyle" && (
            <>
              <Text style={styles.sectionTitle}>Lifestyle Tips</Text>
              {lifestyleRecs.length > 0 ? (
                lifestyleRecs.map(rec => renderRecommendationCard(rec, "fitness", "#64B5F6", "#E3F2FD"))
              ) : (
                <Text style={{ color: COLOR_TEXT_MUTED, marginTop: 8 }}>No lifestyle tips recommended.</Text>
              )}

              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Diet Recommendations</Text>
              {dietRecs.length > 0 ? (
                dietRecs.map(rec => renderRecommendationCard(rec, "nutrition", "#FF9800", "#FFF3E0"))
              ) : (
                <Text style={{ color: COLOR_TEXT_MUTED, marginTop: 8 }}>No diet tips recommended.</Text>
              )}
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLOR_BG }}>
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
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  loadingCircleContainer: {
    position: "relative",
    marginBottom: 40,
  },
  loadingCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 6,
    borderColor: "#E6E1D8",
    borderTopColor: COLOR_PRIMARY,
    borderRightColor: COLOR_PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  analyzingTitle: {
    fontFamily: "serif",
    fontSize: 26,
    fontWeight: "700",
    color: COLOR_PRIMARY,
    marginBottom: 16,
  },
  analyzingSub: {
    textAlign: "center",
    color: COLOR_TEXT_MUTED,
    lineHeight: 22,
    fontSize: 14,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  checklist: {
    width: "100%",
    backgroundColor: "#F4F1EA",
    padding: 24,
    borderRadius: 16,
    gap: 16,
  },
  checkItem: { flexDirection: "row", alignItems: "center", gap: 14 },
  checkCircleActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E4DCD0",
    justifyContent: "center",
    alignItems: "center",
  },
  checkText: { fontSize: 14, color: COLOR_PRIMARY, fontWeight: "400" },

  // Results
  resultCard: {
    backgroundColor: "#F4F1EA",
    borderRadius: 20,
    padding: 16,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLOR_PRIMARY,
    marginBottom: 12,
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLOR_PRIMARY,
    marginBottom: 12,
  },
  resultsPhoto: { width: width * 0.35, height: width * 0.42, borderRadius: 16 },
  scoreContainer: { flex: 1, alignItems: "center" },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    borderColor: "#E6E1D8",
    borderTopColor: COLOR_PRIMARY,
    borderRightColor: COLOR_PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  scoreTextWrapper: { alignItems: "center" },
  scoreNumber: { fontSize: 28, fontWeight: "700", color: COLOR_PRIMARY, marginTop: 4 },
  scoreMax: { fontSize: 12, color: COLOR_TEXT_MUTED, marginTop: -4 },
  scoreLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLOR_PRIMARY,
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: COLOR_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: { color: "#FFF", fontSize: 12, fontWeight: "500" },

  overviewText: {
    fontSize: 14,
    color: COLOR_TEXT_MUTED,
    lineHeight: 22,
  },

  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    backgroundColor: "#E4DCD0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pillText: { fontSize: 13, color: COLOR_TEXT_MUTED, fontWeight: "500" },

  concernsList: { gap: 8 },
  concernItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9F6F0",
    borderRadius: 16,
    padding: 12,
  },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  concernName: { fontSize: 14, color: COLOR_TEXT_MUTED },
  concernLevel: { fontSize: 13, color: COLOR_TEXT_MUTED },

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
    width: 56,
    height: 56,
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  productInfo: { flex: 1, marginRight: 12 },
  productType: {
    fontSize: 14,
    fontWeight: "700",
    color: COLOR_PRIMARY,
    marginBottom: 4,
  },
  productName: { fontSize: 13, color: COLOR_TEXT_MUTED, marginBottom: 6 },
  productDesc: { fontSize: 12, color: COLOR_TEXT_MUTED, lineHeight: 18 },
});
