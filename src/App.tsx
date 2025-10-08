import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Sparkles, Upload, Facebook, Check, Circle, RefreshCw, Copy } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const FACEBOOK_APP_ID = '1459361628827530';

interface CardData {
  title: string;
  mediaType: string;
  copyWrite: string;
  originalFullPost: string | null;
  fullPost: string | null;
  artworkRecommendation: string | null;
  approvedCaption: string | null;
  isApproved: boolean;
  selectedMedia: { type: string; source: string; data: any; url?: string } | null;
  fbPage: { id: string; name: string; access_token: string } | null;
  isExpanded: boolean;
  isArtworkExpanded: boolean;
  aiPrompt: string;
}

function App() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('Thailand');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('th');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [cardData, setCardData] = useState<Record<string, CardData>>({});
  const [expandingCard, setExpandingCard] = useState<string | null>(null);
  const [rewritingCard, setRewritingCard] = useState<string | null>(null);
  const [generatingMedia, setGeneratingMedia] = useState<string | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<Record<string, 'ai' | 'upload'>>({});
  const [postingCard, setPostingCard] = useState<string | null>(null); // State for loading indicator

  useEffect(() => {
    // Load Facebook SDK script
    const loadFacebookSDK = () => {
      if ((window as any).FB) {
        return;
      }

      // Define fbAsyncInit before loading the script
      (window as any).fbAsyncInit = function() {
        (window as any).FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v21.0'
        });
        console.log('Facebook SDK initialized with App ID:', FACEBOOK_APP_ID);
      };

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';

      document.body.appendChild(script);
    };

    loadFacebookSDK();
  }, []);

  const categories = [
    { id: 'Content to Share', icon: '📢', label: 'Content to Share' },
    { id: 'Product Highlight', icon: '✨', label: 'Product Highlight' },
    { id: 'Audience Application', icon: '🙋‍♀️', label: 'Audience Application' },
    { id: 'Activity/Mini Game', icon: '🎲', label: 'Activity/Mini Game' }
  ];

  const months = [
    { value: '', label: selectedLanguage === 'th' ? '-- ไม่ระบุเดือน --' : '-- No specific month --' },
    { value: 'January', label: selectedLanguage === 'th' ? 'มกราคม' : 'January' },
    { value: 'February', label: selectedLanguage === 'th' ? 'กุมภาพันธ์' : 'February' },
    { value: 'March', label: selectedLanguage === 'th' ? 'มีนาคม' : 'March' },
    { value: 'April', label: selectedLanguage === 'th' ? 'เมษายน' : 'April' },
    { value: 'May', label: selectedLanguage === 'th' ? 'พฤษภาคม' : 'May' },
    { value: 'June', label: selectedLanguage === 'th' ? 'มิถุนายน' : 'June' },
    { value: 'July', label: selectedLanguage === 'th' ? 'กรกฎาคม' : 'July' },
    { value: 'August', label: selectedLanguage === 'th' ? 'สิงหาคม' : 'August' },
    { value: 'September', label: selectedLanguage === 'th' ? 'กันยายน' : 'September' },
    { value: 'October', label: selectedLanguage === 'th' ? 'ตุลาคม' : 'October' },
    { value: 'November', label: selectedLanguage === 'th' ? 'พฤศจิกายน' : 'November' },
    { value: 'December', label: selectedLanguage === 'th' ? 'ธันวาคม' : 'December' }
  ];

  const tones = [
    { value: 'default', label: selectedLanguage === 'th' ? 'ค่าเริ่มต้น' : 'Default' },
    { value: 'professional', label: selectedLanguage === 'th' ? 'เป็นทางการ' : 'Professional' },
    { value: 'playful', label: selectedLanguage === 'th' ? 'เป็นกันเอง/สนุกสนาน' : 'Playful' },
    { value: 'persuasive', label: selectedLanguage === 'th' ? 'โน้มน้าวใจ' : 'Persuasive' }
  ];

  const generateIdeas = async () => {
    if (!selectedCategory) return;

    setIsGenerating(true);
    setError(null);
    setIdeas([]);
    setCardData({});

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: `Generate 4 '${selectedCategory}' ideas for Thai restaurant and massage shop owners${selectedMonth ? ` with content relevant to ${selectedMonth} in ${selectedCountry}` : ``}. Each idea must contain:\n**Content Title:** (An attractive title)\n**Media Type:** (e.g., Infographic, Photo Album)\n**Copy Write (Draft):** (Facebook Caption, 2-3 sentences with emojis)\n\n**VERY IMPORTANT:** Separate each idea with '---'`,
            tone: 'professional',
            length: 'long',
            language: selectedLanguage
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to generate ideas');
      }

      const data = await response.json();
      const generatedIdeas = data.content.split('---').filter((idea: string) => idea.trim() !== '');

      const parsedIdeas = generatedIdeas.map((ideaText: string, index: number) => {
        const lines = ideaText.trim().split('\n');
        const cardId = `card-${Date.now()}-${index}`;

        let title = '', mediaType = '', copyWrite = '';

        lines.forEach(line => {
          if (line.includes('**Content Title:**') || line.includes('**หัวข้อคอนเทนต์:**')) {
            title = line.split(':**')[1]?.trim() || '';
          } else if (line.includes('**Media Type:**') || line.includes('**ประเภทมีเดีย:**')) {
            mediaType = line.split(':**')[1]?.trim() || '';
          } else if (line.includes('**Copy Write') || line.includes('**Copy Write')) {
            copyWrite = line.split(':**')[1]?.trim() || '';
          }
        });

        const prefillPrompt = selectedLanguage === 'th'
          ? `แบนเนอร์การตลาดคุณภาพสูงสำหรับ Facebook หัวข้อ: "${title}" สำหรับเจ้าของร้านอาหารและร้านนวดไทย`
          : `High-quality marketing banner for Facebook. Topic: "${title}" for restaurant and massage shop owners`;

        setCardData(prev => ({
          ...prev,
          [cardId]: {
            title,
            mediaType,
            copyWrite,
            originalFullPost: null,
            fullPost: null,
            artworkRecommendation: null,
            approvedCaption: null,
            isApproved: false,
            selectedMedia: null,
            fbPage: null,
            isExpanded: false,
            isArtworkExpanded: false,
            aiPrompt: prefillPrompt
          }
        }));

        setActiveMediaTab(prev => ({ ...prev, [cardId]: 'ai' }));

        return { id: cardId, title, mediaType, copyWrite };
      });

      setIdeas(parsedIdeas);
    } catch (err: any) {
      console.error('Error details:', err);
      const errorMsg = err.message || 'ไม่สามารถสร้างไอเดียได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';
      setError(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const expandIdea = async (cardId: string) => {
    const card = cardData[cardId];
    if (!card) return;

    if (card.isExpanded && card.fullPost) {
      setCardData(prev => ({
        ...prev,
        [cardId]: { ...prev[cardId], isExpanded: false }
      }));
      return;
    }

    if (card.fullPost) {
      setCardData(prev => ({
        ...prev,
        [cardId]: { ...prev[cardId], isExpanded: true }
      }));
      return;
    }

    setExpandingCard(cardId);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: selectedLanguage === 'th'
              ? `จากไอเดียนี้:\n- หัวข้อ: "${card.title}"\n- ร่าง: "${card.copyWrite}"\n\nทำสิ่งต่อไปนี้:\n\n**โพสต์ฉบับเต็ม**\nเขียนโพสต์ Facebook ฉบับเต็ม (ใช้น้ำเสียงกึ่งทางการ เป็นกันเอง มีอิโมจิ call-to-action และแฮชแท็ก 5-7 อัน)\n\n**คำแนะนำ Artwork**\nแนะนำแนวคิดกราฟิกสำหรับ Artwork:\n• Background/Main Image: อธิบายภาพหลักหรือพื้นหลัง\n• Headline Text: ข้อความหัวข้อที่ควรใส่\n• Supporting Elements: องค์ประกอบเสริมอื่นๆ\n• Overall Look: บรรยากาศและสไตล์โดยรวม\n\n**สำคัญมาก:** แยกเนื้อหาด้วยหัวข้อที่ชัดเจน "**โพสต์ฉบับเต็ม**" และ "**คำแนะนำ Artwork**"`
              : `From this content idea:\n- Title: "${card.title}"\n- Draft Copy: "${card.copyWrite}"\n\nDo the following:\n\n**Full Post**\nWrite a complete Facebook post (semi-formal, friendly tone with emojis, call-to-action, and 5-7 hashtags)\n\n**Artwork Recommendation**\nSuggest artwork graphic concept:\n• Background/Main Image: describe the main visual or background\n• Headline Text: text that should appear on the graphic\n• Supporting Elements: additional design elements\n• Overall Look: overall style and atmosphere\n\n**VERY IMPORTANT:** Separate content with clear headings "**Full Post**" and "**Artwork Recommendation**"`,
            tone: 'professional',
            length: 'long',
            language: selectedLanguage
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to expand');

      const data = await response.json();
      const fullPostKey = selectedLanguage === 'th' ? '**โพสต์ฉบับเต็ม**' : '**Full Post**';
      const artworkKey = selectedLanguage === 'th' ? '**คำแนะนำ Artwork**' : '**Artwork Recommendation**';

      let fullPost = '';
      let artworkRec = '';

      const fullPostIndex = data.content.indexOf(fullPostKey);
      const artworkIndex = data.content.indexOf(artworkKey);

      if (fullPostIndex !== -1 && artworkIndex !== -1 && artworkIndex > fullPostIndex) {
        // Both sections found in correct order
        fullPost = data.content.substring(fullPostIndex + fullPostKey.length, artworkIndex).replace(/\*\*/g, '').trim();
        artworkRec = data.content.substring(artworkIndex + artworkKey.length).replace(/\*\*/g, '').trim();
      } else if (fullPostIndex !== -1) {
        // Only full post found
        fullPost = data.content.substring(fullPostIndex + fullPostKey.length).replace(/\*\*/g, '').trim();
        artworkRec = 'Please expand again to generate artwork recommendation';
      } else {
        // Fallback - no clear sections
        fullPost = data.content.replace(/\*\*/g, '').trim();
        artworkRec = 'Please expand again to generate artwork recommendation';
      }

      setCardData(prev => ({
        ...prev,
        [cardId]: {
          ...prev[cardId],
          originalFullPost: fullPost,
          fullPost,
          artworkRecommendation: artworkRec,
          isExpanded: true,
          isArtworkExpanded: false
        }
      }));
    } catch (err) {
      console.error('Expand error:', err);
    } finally {
      setExpandingCard(null);
    }
  };

  const rewriteTone = async (cardId: string, tone: string) => {
    const card = cardData[cardId];
    if (!card || !card.fullPost) return;

    if (tone === 'default' && card.originalFullPost) {
      setCardData(prev => ({
        ...prev,
        [cardId]: { ...prev[cardId], fullPost: prev[cardId].originalFullPost }
      }));
      return;
    }

    setRewritingCard(cardId);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: `Rewrite the following post to have a '${tone}' tone:\n\n${card.fullPost}`,
            tone,
            length: 'medium',
            language: selectedLanguage
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to rewrite');

      const data = await response.json();
      setCardData(prev => ({
        ...prev,
        [cardId]: { ...prev[cardId], fullPost: data.content }
      }));
    } catch (err) {
      console.error('Rewrite error:', err);
    } finally {
      setRewritingCard(null);
    }
  };

  const approveCaption = (cardId: string) => {
    const card = cardData[cardId];
    if (!card) return;

    setCardData(prev => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        isApproved: !prev[cardId].isApproved,
        approvedCaption: !prev[cardId].isApproved ? prev[cardId].fullPost : null
      }
    }));
  };

  const updateApprovedCaption = (cardId: string, newCaption: string) => {
    setCardData(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], approvedCaption: newCaption }
    }));
  };

  const handleFileUpload = async (cardId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCardData(prev => ({
        ...prev,
        [cardId]: {
          ...prev[cardId],
          selectedMedia: {
            type: file.type.startsWith('image/') ? 'image' : 'video',
            source: 'upload',
            data: file,
            url: e.target?.result as string
          }
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const generateAIMedia = async (cardId: string) => {
    const card = cardData[cardId];
    if (!card || !card.aiPrompt) {
      alert(selectedLanguage === 'th' ? 'กรุณากรอกคำสั่ง (Prompt)' : 'Please enter a prompt');
      return;
    }

    setGeneratingMedia(cardId);

    try {
      // Use Pollinations.ai API for image generation
      const encodedPrompt = encodeURIComponent(card.aiPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

      // Preload the image to ensure it's generated
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      setCardData(prev => ({
        ...prev,
        [cardId]: {
          ...prev[cardId],
          selectedMedia: { type: 'image', source: 'ai', data: imageUrl, url: imageUrl }
        }
      }));

      alert(selectedLanguage === 'th' ? 'สร้างภาพสำเร็จ!' : 'Image generated successfully!');
    } catch (err: any) {
      console.error('AI generation error:', err);
      alert(selectedLanguage === 'th'
        ? `ไม่สามารถสร้างภาพได้: ${err.message}`
        : `Failed to generate image: ${err.message}`);
    } finally {
      setGeneratingMedia(null);
    }
  };

  const connectFacebook = (cardId: string) => {
    console.log('Connect Facebook clicked for card:', cardId);
    console.log('FB object available:', !!(window as any).FB);

    if (!(window as any).FB) {
      alert(selectedLanguage === 'th'
        ? 'Facebook SDK ยังไม่โหลด กรุณารีเฟรชหน้าเว็บ'
        : 'Facebook SDK not loaded. Please refresh the page.');
      return;
    }

    (window as any).FB.login((response: any) => {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;

        (window as any).FB.api('/me/accounts', { access_token: accessToken }, (pagesResponse: any) => {
          if (pagesResponse && pagesResponse.data && pagesResponse.data.length > 0) {
            const pages = pagesResponse.data;

            if (pages.length === 1) {
              const page = pages[0];
              setCardData(prev => ({
                ...prev,
                [cardId]: {
                  ...prev[cardId],
                  fbPage: { id: page.id, name: page.name, access_token: page.access_token }
                }
              }));
              alert(selectedLanguage === 'th'
                ? `เชื่อมต่อกับ ${page.name} แล้ว`
                : `Connected to ${page.name}`);
            } else {
              const pageNames = pages.map((p: any, idx: number) => `${idx + 1}. ${p.name}`).join('\n');
              const selection = prompt(
                `${selectedLanguage === 'th' ? 'เลือก Facebook Page (ใส่หมายเลข):' : 'Select a Facebook Page (enter number):'}\n\n${pageNames}`
              );

              const pageIndex = parseInt(selection || '1') - 1;
              if (pageIndex >= 0 && pageIndex < pages.length) {
                const page = pages[pageIndex];
                setCardData(prev => ({
                  ...prev,
                  [cardId]: {
                    ...prev[cardId],
                    fbPage: { id: page.id, name: page.name, access_token: page.access_token }
                  }
                }));
                alert(selectedLanguage === 'th'
                  ? `เชื่อมต่อกับ ${page.name} แล้ว`
                  : `Connected to ${page.name}`);
              }
            }
          } else {
            alert(selectedLanguage === 'th'
              ? 'ไม่พบ Facebook Pages กรุณาสร้าง Page ก่อน หรือตรวจสอบสิทธิ์การเข้าถึง'
              : 'No Facebook Pages found. Please create a Page first or check access permissions.');
          }
        });
      } else {
        alert(selectedLanguage === 'th' ? 'การเชื่อมต่อถูกยกเลิก' : 'Login cancelled');
      }
    }, {
      scope: 'pages_show_list,pages_read_engagement,pages_manage_posts', // pages_manage_metadata is often not needed
      auth_type: 'rerequest'
    });
  };

  // ========== START: REVISED FUNCTION ==========
  const postToFacebook = async (cardId: string) => {
    const card = cardData[cardId];
    if (!card || !card.approvedCaption || !card.selectedMedia || !card.fbPage) return;
  
    setPostingCard(cardId); // Show loading indicator
  
    try {
      if (card.selectedMedia.type === 'image') {
        const formData = new FormData();
        formData.append('access_token', card.fbPage.access_token);
        formData.append('published', 'false'); // Upload as an unpublished photo first
  
        // Convert the image data to a Blob to ensure it's sent correctly
        if (card.selectedMedia.source === 'upload') {
          formData.append('source', card.selectedMedia.data as File);
        } else { // AI-generated image
          const response = await fetch(card.selectedMedia.url!);
          const blob = await response.blob();
          formData.append('source', blob);
        }
  
        // Step 1: Upload the photo to get a media ID
        const uploadResponse = await fetch(`https://graph.facebook.com/v21.0/${card.fbPage.id}/photos`, {
          method: 'POST',
          body: formData,
        });
  
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error('Facebook Upload Error:', errorData);
          throw new Error(errorData.error.message || 'Failed to upload photo.');
        }
  
        const uploadResult = await uploadResponse.json();
        const mediaId = uploadResult.id;
  
        // Step 2: Create the post using the media ID
        const postResponse = await fetch(`https://graph.facebook.com/v21.0/${card.fbPage.id}/feed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: card.approvedCaption,
            attached_media: `[{"media_fbid":"${mediaId}"}]`,
            access_token: card.fbPage.access_token,
          }),
        });
  
        if (!postResponse.ok) {
          const errorData = await postResponse.json();
          console.error('Facebook Post Error:', errorData);
          throw new Error(errorData.error.message || 'Failed to create post.');
        }
  
        alert(selectedLanguage === 'th' ? 'โพสต์สำเร็จ!' : 'Posted successfully!');
  
      } else if (card.selectedMedia.type === 'video') {
        alert('Video posting is not yet implemented.');
      }
  
    } catch (error: any) {
      console.error(error);
      alert(`${selectedLanguage === 'th' ? 'เกิดข้อผิดพลาดในการโพสต์: ' : 'Error posting: '}${error.message}`);
    } finally {
        setPostingCard(null); // Hide loading indicator
    }
  };
  // ========== END: REVISED FUNCTION ==========

  const isReadyToPost = (cardId: string) => {
    const card = cardData[cardId];
    return card?.isApproved && card?.selectedMedia && card?.fbPage;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
            Local For You
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mt-2">
            {selectedLanguage === 'th' ? 'เครื่องมือช่วยคิดคอนเทนต์' : 'Content Idea Generator'}
          </p>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
            {selectedLanguage === 'th'
              ? 'เลือกหมวดหมู่ที่คุณสนใจ แล้วให้ AI ช่วยสร้างสรรค์ไอเดียสุดปังสำหรับโปรโมทความเป็นท้องถิ่นที่ไม่เหมือนใคร!'
              : 'Select a category that interests you and let AI create amazing ideas to promote your unique local business!'}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-lg mx-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {selectedLanguage === 'th' ? 'ภาษา' : 'Language'}
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="th">ไทย</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {selectedLanguage === 'th' ? 'ประเทศ' : 'Country'}
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Thailand">Thailand</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
              <option value="Australia">Australia</option>
              <option value="Canada">Canada</option>
            </select>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-lg font-semibold text-gray-700 mb-3 text-center">
            {selectedLanguage === 'th' ? 'เลือกเดือน (ถ้ามี)' : 'Select Month (Optional)'}
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="block w-full max-w-xs mx-auto bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3 text-center">
            {selectedLanguage === 'th' ? 'เลือกหมวดหมู่คอนเทนต์' : 'Select Content Category'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-emerald-400 flex flex-col items-center justify-center text-center h-full transition-all ${
                  selectedCategory === category.id ? 'bg-emerald-500 text-white transform -translate-y-1' : ''
                }`}
              >
                <span className="text-2xl">{category.icon}</span>
                <span className="block mt-1 font-medium text-sm">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center my-8">
          <button
            onClick={generateIdeas}
            disabled={!selectedCategory || isGenerating}
            className="bg-emerald-500 text-white font-bold py-3 px-8 rounded-full hover:bg-emerald-600 transition-transform transform hover:scale-105 shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="animate-spin" size={20} />
                {selectedLanguage === 'th' ? 'กำลังสร้าง...' : 'Generating...'}
              </span>
            ) : (
              selectedLanguage === 'th' ? 'สร้างไอเดียคอนเทนต์' : 'Generate Content Ideas'
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center mb-4">
            <strong className="font-bold">{selectedLanguage === 'th' ? 'เกิดข้อผิดพลาด!' : 'Error!'}</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <div className="space-y-4">
          {ideas.map((idea, index) => {
            const card = cardData[idea.id];
            if (!card) return null;

            const readyChecks = {
              caption: card.isApproved,
              media: !!card.selectedMedia,
              page: !!card.fbPage
            };

            return (
              <div
                key={idea.id}
                className="bg-white p-5 rounded-lg shadow-md border border-gray-200"
                style={{ animation: `fadeIn 0.5s forwards ${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-emerald-600">{card.title}</h3>
                    <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-2">
                      {card.mediaType}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mt-3">{card.copyWrite}</p>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => expandIdea(idea.id)}
                    className="w-full text-center bg-emerald-50 text-emerald-700 font-semibold py-2 px-4 rounded-lg hover:bg-emerald-100 flex items-center justify-center gap-2"
                  >
                    {expandingCard === idea.id ? (
                      <>
                        <RefreshCw className="animate-spin" size={18} />
                        {selectedLanguage === 'th' ? 'กำลังเขียน...' : 'Writing...'}
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        {card.isExpanded
                          ? (selectedLanguage === 'th' ? 'ย่อลง' : 'Collapse')
                          : (selectedLanguage === 'th' ? '✨ เขียนฉบับเต็ม' : '✨ Write Full Version')}
                      </>
                    )}
                  </button>

                  {card.isExpanded && card.fullPost && (
                    <>
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-end mb-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(card.fullPost || '');
                              alert(selectedLanguage === 'th' ? 'คัดลอกแล้ว!' : 'Copied!');
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            <Copy size={14} />
                            {selectedLanguage === 'th' ? 'คัดลอก' : 'Copy'}
                          </button>
                        </div>
                        <div
                          className="text-gray-700 whitespace-pre-wrap mb-3"
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setCardData(prev => ({
                            ...prev,
                            [idea.id]: { ...prev[idea.id], fullPost: e.currentTarget.innerText }
                          }))}
                        >
                          {card.fullPost}
                        </div>
                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => approveCaption(idea.id)}
                            className={`text-sm font-medium py-2 px-4 rounded-full ${
                              card.isApproved
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            {card.isApproved
                              ? (selectedLanguage === 'th' ? 'ยกเลิกอนุมัติ' : 'Unapprove')
                              : (selectedLanguage === 'th' ? 'อนุมัติ Caption' : 'Approve Caption')}
                          </button>
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold">
                              {selectedLanguage === 'th' ? '✨ ปรับโทน' : '✨ Adjust Tone'}
                            </label>
                            <select
                              onChange={(e) => rewriteTone(idea.id, e.target.value)}
                              className="border border-gray-300 rounded-md p-1 text-xs"
                              defaultValue="default"
                            >
                              {tones.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                            {rewritingCard === idea.id && (
                              <div className="text-xs">
                                <RefreshCw className="animate-spin inline" size={12} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-bold text-lg mb-2">
                          {selectedLanguage === 'th' ? 'มีเดีย' : 'Media'}
                        </h4>
                        <div className="flex border-b mb-3">
                          <button
                            onClick={() => setActiveMediaTab(prev => ({ ...prev, [idea.id]: 'ai' }))}
                            className={`border-b-2 pb-1 px-4 text-sm font-semibold ${
                              activeMediaTab[idea.id] === 'ai'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-gray-500'
                            }`}
                          >
                            {selectedLanguage === 'th' ? 'สร้างด้วย AI' : 'AI Generate'}
                          </button>
                          <button
                            onClick={() => setActiveMediaTab(prev => ({ ...prev, [idea.id]: 'upload' }))}
                            className={`border-b-2 pb-1 px-4 text-sm font-semibold ${
                              activeMediaTab[idea.id] === 'upload'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-gray-500'
                            }`}
                          >
                            {selectedLanguage === 'th' ? 'อัปโหลด' : 'Upload'}
                          </button>
                        </div>

                        {activeMediaTab[idea.id] === 'ai' ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium">
                                {selectedLanguage === 'th' ? 'คำสั่ง (Prompt)' : 'Prompt'}
                              </label>
                              <textarea
                                value={card.aiPrompt}
                                onChange={(e) => setCardData(prev => ({
                                  ...prev,
                                  [idea.id]: { ...prev[idea.id], aiPrompt: e.target.value }
                                }))}
                                className="w-full border border-gray-300 rounded-md p-2 mt-1 text-sm"
                                rows={4}
                              />
                            </div>
                            <button
                              onClick={() => generateAIMedia(idea.id)}
                              disabled={generatingMedia === idea.id}
                              className="bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 w-full disabled:bg-gray-400"
                            >
                              {generatingMedia === idea.id ? (
                                <span className="flex items-center justify-center gap-2">
                                  <RefreshCw className="animate-spin" size={16} />
                                  {selectedLanguage === 'th' ? 'กำลังสร้าง...' : 'Generating...'}
                                </span>
                              ) : (
                                selectedLanguage === 'th' ? 'สร้าง' : 'Generate'
                              )}
                            </button>
                          </div>
                        ) : (
                          <div>
                            <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 block text-center cursor-pointer hover:border-emerald-500">
                              <Upload className="mx-auto text-gray-400" size={32} />
                              <p className="mt-2 text-sm text-gray-600">
                                {selectedLanguage === 'th' ? 'คลิกเพื่อเลือกไฟล์' : 'Click to select file'}
                              </p>
                              <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(idea.id, e.target.files[0])}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}

                        {card.selectedMedia && (
                          <div className="mt-3 p-3 bg-emerald-50 rounded-lg border-2 border-emerald-500">
                            {card.selectedMedia.type === 'image' ? (
                              <img src={card.selectedMedia.url} alt="Selected" className="max-h-48 mx-auto rounded" />
                            ) : (
                              <video src={card.selectedMedia.url} controls className="max-h-48 mx-auto rounded" />
                            )}
                            <p className="text-center text-sm text-emerald-700 mt-2">
                              ✓ {selectedLanguage === 'th' ? 'เลือกมีเดียแล้ว' : 'Media Selected'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4 mt-4">
                        <div className="mt-4 space-y-1 text-sm">
                            <div className={readyChecks.caption ? 'text-green-600' : 'text-gray-500'}>
                                {readyChecks.caption ? <Check className="inline" size={16} /> : <Circle className="inline" size={16} />}
                                {' '}{selectedLanguage === 'th' ? 'อนุมัติ Caption แล้ว' : 'Caption approved'}
                            </div>
                            <div className={readyChecks.media ? 'text-green-600' : 'text-gray-500'}>
                                {readyChecks.media ? <Check className="inline" size={16} /> : <Circle className="inline" size={16} />}
                                {' '}{selectedLanguage === 'th' ? 'เลือกมีเดียแล้ว' : 'Media selected'}
                            </div>
                            <div className={readyChecks.page ? 'text-green-600' : 'text-gray-500'}>
                                {readyChecks.page ? <Check className="inline" size={16} /> : <Circle className="inline" size={16} />}
                                {' '}{selectedLanguage === 'th' ? 'เชื่อมต่อ Facebook Page แล้ว' : 'Facebook Page connected'}
                            </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                          {!card.fbPage ? (
                            <button
                              type="button"
                              onClick={() => connectFacebook(idea.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex-grow flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Facebook size={18} />
                              {selectedLanguage === 'th' ? 'เชื่อมต่อ Facebook Page' : 'Connect Facebook Page'}
                            </button>
                          ) : (
                            <div
                              className="bg-gray-200 border border-gray-300 text-gray-600 font-bold py-2 px-4 rounded-lg flex-grow flex items-center justify-center gap-2"
                            >
                              <Facebook size={18} />
                              Connected: {card.fbPage.name.substring(0, 15)}...
                            </div>
                          )}
                          <button
                            onClick={() => postToFacebook(idea.id)}
                            disabled={!isReadyToPost(idea.id) || postingCard === idea.id}
                            className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 flex-grow disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {postingCard === idea.id ? (
                                <span className="flex items-center justify-center gap-2">
                                <RefreshCw className="animate-spin" size={16} />
                                {selectedLanguage === 'th' ? 'กำลังโพสต์...' : 'Posting...'}
                                </span>
                            ) : (
                                selectedLanguage === 'th' ? 'โพสต์ไปที่ Facebook' : 'Post to Facebook'
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;