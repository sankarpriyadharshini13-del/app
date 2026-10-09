import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, StyleProp, Text, TextInput, View, ViewStyle, useWindowDimensions } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutLeft, LinearTransition, SlideInDown, SlideOutDown, runOnJS,
  useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import { api } from './src/api'

type P = { id: number; name: string; category: string; price: number; mrp: number; rating: number; image: string; featured: boolean }
type Ctx = { products: P[]; loading: boolean; cart: Record<number, number>; wish: number[]; setQty: (id: number, q: number) => void; toggleWish: (id: number) => void; clear: () => void }
const S = createContext<Ctx>(null!)
const useS = () => useContext(S)
const inr = (n: number) => '₹' + n.toLocaleString('en-IN')
const off = (p: P) => Math.round(((p.mrp - p.price) / p.mrp) * 100)
const BG = '#f2f2f4'
const shadow = { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 }

function Press({ onPress, style, children }: { onPress?: () => void; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const s = useSharedValue(1)
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }))
  return (
    <Pressable onPress={onPress} onPressIn={() => { s.value = withTiming(0.96, { duration: 90 }) }} onPressOut={() => { s.value = withSpring(1) }}>
      <Animated.View style={[style, a]}>{children}</Animated.View>
    </Pressable>)
}
const GButton = ({ label, onPress, small }: { label: string; onPress: () => void; small?: boolean }) => (
  <Press onPress={onPress}>
    <LinearGradient colors={['#3a3a3c', '#000']} style={{ borderRadius: 16, paddingVertical: small ? 9 : 14, alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '600', fontSize: small ? 13 : 16 }}>{label}</Text>
    </LinearGradient>
  </Press>)

function Heart({ id }: { id: number }) {
  const { wish, toggleWish } = useS()
  const on = wish.includes(id)
  const sc = useSharedValue(1)
  useEffect(() => { if (on) sc.value = withSequence(withTiming(1.5, { duration: 110 }), withSpring(1, { damping: 6 })) }, [on])
  const a = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))
  return (
    <Pressable onPress={() => toggleWish(id)} style={{ position: 'absolute', top: 8, right: 8 }}>
      <Animated.View style={[{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.92)', alignItems: 'center', justifyContent: 'center' }, a]}>
        <Ionicons name={on ? 'heart' : 'heart-outline'} size={19} color={on ? '#ef4444' : '#111'} />
      </Animated.View>
    </Pressable>)
}

function Card({ p, i, w }: { p: P; i: number; w: number }) {
  const { cart, setQty } = useS()
  return (
    <Animated.View entering={FadeInDown.delay(i * 40).springify()} style={{ width: w }}>
      <Press style={{ backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', ...shadow }}>
        <View style={{ height: w * 1.2, backgroundColor: '#eee' }}>
          <Image source={{ uri: p.image }} style={{ flex: 1 }} />
          <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#000', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{off(p)}% OFF</Text></View>
          <Heart id={p.id} />
          <View style={{ position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,.92)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Ionicons name="star" size={11} color="#f59e0b" /><Text style={{ fontSize: 12, fontWeight: '600' }}>{p.rating}</Text></View>
        </View>
        <View style={{ padding: 12, gap: 4 }}>
          <Text numberOfLines={1} style={{ fontWeight: '500' }}>{p.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={{ fontWeight: '700' }}>{inr(p.price)}</Text>
            <Text style={{ fontSize: 12, color: '#aaa', textDecorationLine: 'line-through' }}>{inr(p.mrp)}</Text></View>
          <GButton small label={cart[p.id] ? `In bag · ${cart[p.id]}` : 'Add to bag'} onPress={() => setQty(p.id, (cart[p.id] || 0) + 1)} />
        </View>
      </Press>
    </Animated.View>)
}

function Skeleton({ w, h, r = 16, style }: { w: number | string; h: number; r?: number; style?: object }) {
  const o = useSharedValue(0.4)
  useEffect(() => { o.value = withRepeat(withTiming(1, { duration: 800 }), -1, true) }, [])
  const a = useAnimatedStyle(() => ({ opacity: o.value }))
  return <Animated.View style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: '#e2e2e5' }, style, a]} />
}

const Title = ({ children }: { children: string }) => <Text style={{ fontSize: 32, fontWeight: '800', letterSpacing: -0.5, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>{children}</Text>

function Home() {
  const { products, loading } = useS()
  const { width } = useWindowDimensions()
  const w = (width - 52) / 2
  const [cat, setCat] = useState('All'); const [q, setQ] = useState('')
  const focus = useSharedValue(0)
  const sA = useAnimatedStyle(() => ({ transform: [{ scale: 1 + focus.value * 0.02 }], shadowOpacity: 0.04 + focus.value * 0.14 }))
  const list = useMemo(() => products.filter((p) => (cat === 'All' || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase())), [products, cat, q])
  const feat = products.filter((p) => p.featured)
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}><Text style={{ color: '#888' }}>Discover</Text><Text style={{ fontSize: 32, fontWeight: '800', letterSpacing: -0.5 }}>Maison</Text></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 14, gap: 10 }}>
        <Animated.View style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, height: 48, shadowColor: '#000', shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }, sA]}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput value={q} onChangeText={setQ} placeholder="Search products" placeholderTextColor="#999" style={{ flex: 1, fontSize: 15 }}
            onFocus={() => { focus.value = withSpring(1) }} onBlur={() => { focus.value = withSpring(0) }} />
        </Animated.View>
        {!!q && <Animated.View entering={FadeIn} exiting={FadeOut}><Pressable onPress={() => setQ('')}><Text style={{ fontWeight: '500' }}>Clear</Text></Pressable></Animated.View>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginTop: 14 }}>
        {['All', 'Electronics', 'Fashion', 'Beauty'].map((c) => (
          <Press key={c} onPress={() => setCat(c)} style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99, backgroundColor: cat === c ? '#000' : '#fff' }}>
            <Text style={{ fontWeight: '500', color: cat === c ? '#fff' : '#555' }}>{c}</Text></Press>))}
      </ScrollView>
      {!q && cat === 'All' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width * 0.82 + 12} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: 20, gap: 12, marginTop: 18 }}>
          {loading ? [0, 1].map((i) => <Skeleton key={i} w={width * 0.82} h={170} r={24} />) : feat.map((p) => (
            <Press key={p.id} style={{ width: width * 0.82, height: 170, borderRadius: 24, overflow: 'hidden' }}>
              <Image source={{ uri: p.image }} style={{ flex: 1 }} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,.8)']} style={{ position: 'absolute', inset: 0, justifyContent: 'flex-end', padding: 16 } as any}>
                <Text style={{ color: '#fff', opacity: 0.8, fontSize: 12 }}>Featured · {off(p)}% off</Text>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>{p.name}</Text>
                <Text style={{ color: '#fff' }}>{inr(p.price)}</Text></LinearGradient>
            </Press>))}
        </ScrollView>)}
      <Text style={{ fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginTop: 22, marginBottom: 12 }}>{cat === 'All' ? 'Trending now' : cat}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 }}>
        {loading ? Array.from({ length: 6 }).map((_, i) => <View key={i} style={{ width: w, gap: 8 }}><Skeleton w={w} h={w * 1.2} r={24} /><Skeleton w={w * 0.7} h={12} r={6} /><Skeleton w={w * 0.4} h={12} r={6} /></View>)
          : list.map((p, i) => <Card key={p.id} p={p} i={i} w={w} />)}
      </View>
      {!loading && !list.length && <Text style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>No products found</Text>}
    </ScrollView>)
}

function CartRow({ p, qty }: { p: P; qty: number }) {
  const { setQty } = useS()
  const x = useSharedValue(0)
  const pan = Gesture.Pan().activeOffsetX([-12, 12]).failOffsetY([-12, 12])
    .onUpdate((e) => { x.value = Math.min(0, e.translationX) })
    .onEnd((e) => { if (e.translationX < -100) x.value = withTiming(-500, { duration: 180 }, () => runOnJS(setQty)(p.id, 0)); else x.value = withSpring(0) })
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  return (
    <Animated.View entering={FadeInDown.springify()} exiting={FadeOutLeft} layout={LinearTransition.springify()} style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: '#ef4444', justifyContent: 'center' }}>
      <Text style={{ position: 'absolute', right: 24, color: '#fff', fontWeight: '700' }}>Delete</Text>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }, a]}>
          <Image source={{ uri: p.image }} style={{ width: 76, height: 92, borderRadius: 16 }} />
          <View style={{ flex: 1 }}><Text numberOfLines={1} style={{ fontWeight: '500' }}>{p.name}</Text><Text style={{ fontSize: 12, color: '#aaa' }}>{p.category}</Text><Text style={{ fontWeight: '700', marginTop: 4 }}>{inr(p.price * qty)}</Text></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f4', borderRadius: 99, padding: 4 }}>
            <Press onPress={() => setQty(p.id, qty - 1)} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="remove" size={18} /></Press>
            <Animated.Text key={qty} entering={FadeInDown.duration(150)} style={{ width: 22, textAlign: 'center', fontWeight: '700' }}>{qty}</Animated.Text>
            <Press onPress={() => setQty(p.id, qty + 1)} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={18} /></Press>
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>)
}

function Cart() {
  const { products, cart, clear } = useS()
  const [done, setDone] = useState(false)
  const items = products.filter((p) => cart[p.id])
  const sub = items.reduce((s, p) => s + p.price * cart[p.id], 0)
  const saved = items.reduce((s, p) => s + (p.mrp - p.price) * cart[p.id], 0)
  return (
    <View style={{ flex: 1 }}>
      <Title>Bag</Title>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 280 }}>
        {items.map((p) => <CartRow key={p.id} p={p} qty={cart[p.id]} />)}
        {!items.length && <Text style={{ textAlign: 'center', color: '#aaa', marginTop: 80 }}>{done ? 'Order placed 🎉 Thank you!' : 'Your bag is empty'}</Text>}
        {!!items.length && <Text style={{ textAlign: 'center', color: '#aaa', fontSize: 12 }}>Swipe left to remove</Text>}
      </ScrollView>
      {!!items.length && (
        <Animated.View entering={SlideInDown.springify().damping(18)} exiting={SlideOutDown} style={{ position: 'absolute', left: 16, right: 16, bottom: 96, backgroundColor: 'rgba(255,255,255,.97)', borderRadius: 28, padding: 16, ...shadow }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: '#888' }}>You save</Text><Text style={{ color: '#16a34a', fontWeight: '600' }}>{inr(saved)}</Text></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 }}><Text style={{ fontWeight: '500' }}>Subtotal</Text><Text style={{ fontWeight: '800', fontSize: 20 }}>{inr(sub)}</Text></View>
          <GButton label="Checkout" onPress={() => { clear(); setDone(true) }} />
        </Animated.View>)}
    </View>)
}

function Wishlist() {
  const { products, wish, toggleWish, setQty, cart } = useS()
  const { width } = useWindowDimensions(); const w = (width - 52) / 2
  const items = products.filter((p) => wish.includes(p.id))
  const pulse = useSharedValue(1)
  useEffect(() => { pulse.value = withRepeat(withSequence(withTiming(1.18, { duration: 700 }), withTiming(1, { duration: 700 })), -1) }, [])
  const pA = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }))
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
      <Title>Wishlist</Title>
      {!items.length ? (
        <View style={{ alignItems: 'center', marginTop: 90 }}>
          <Animated.View style={pA}><Ionicons name="heart-outline" size={110} color="#111" /></Animated.View>
          <Text style={{ fontWeight: '700', fontSize: 18, marginTop: 12 }}>Nothing saved yet</Text><Text style={{ color: '#aaa' }}>Tap the heart on anything you love.</Text>
        </View>) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 }}>
          {items.map((p) => (
            <Animated.View key={p.id} exiting={FadeOut} layout={LinearTransition.springify()} style={{ width: w, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' }}>
              <View style={{ height: w * 1.2 }}><Image source={{ uri: p.image }} style={{ flex: 1 }} /><Heart id={p.id} /></View>
              <View style={{ padding: 12, gap: 4 }}><Text numberOfLines={1} style={{ fontWeight: '500' }}>{p.name}</Text><Text style={{ fontWeight: '700' }}>{inr(p.price)}</Text>
                <GButton small label="Move to bag" onPress={() => { setQty(p.id, (cart[p.id] || 0) + 1); toggleWish(p.id) }} /></View>
            </Animated.View>))}
        </View>)}
    </ScrollView>)
}

function Profile() {
  const { cart, wish } = useS()
  const rows: [keyof typeof Ionicons.glyphMap, string, string][] = [['cube-outline', 'My Orders', '3 delivered'], ['location-outline', 'Addresses', '2 saved'], ['card-outline', 'Payment Methods', 'Visa •• 4242'], ['notifications-outline', 'Notifications', 'On'], ['moon-outline', 'Appearance', 'Light'], ['lock-closed-outline', 'Privacy & Security', '']]
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
      <Title>Profile</Title>
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <LinearGradient colors={['#555', '#000']} style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 26, fontWeight: '600' }}>A</Text></LinearGradient>
          <View><Text style={{ fontSize: 18, fontWeight: '700' }}>Alex Morgan</Text><Text style={{ color: '#aaa' }}>alex@maison.com</Text></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {([['In bag', Object.keys(cart).length], ['Saved', wish.length], ['Orders', 3]] as const).map(([l, v]) => (
            <View key={l} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 18, paddingVertical: 12, alignItems: 'center' }}><Text style={{ fontSize: 20, fontWeight: '800' }}>{v}</Text><Text style={{ fontSize: 12, color: '#aaa' }}>{l}</Text></View>))}
        </View>
        <View style={{ backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' }}>
          {rows.map(([ic, t, s], i) => (
            <Press key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderColor: '#f0f0f0', backgroundColor: '#fff' }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#f2f2f4', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={ic} size={19} /></View>
              <Text style={{ flex: 1, fontWeight: '500' }}>{t}</Text><Text style={{ color: '#aaa', fontSize: 13 }}>{s}</Text><Ionicons name="chevron-forward" size={16} color="#bbb" />
            </Press>))}
        </View>
        <Press style={{ backgroundColor: '#fff', borderRadius: 18, paddingVertical: 14, alignItems: 'center' }}><Text style={{ color: '#ef4444', fontWeight: '600' }}>Sign out</Text></Press>
      </View>
    </ScrollView>)
}

const TABS = [['home', 'home'], ['cart', 'bag'], ['wish', 'heart'], ['me', 'person']] as const
function Root() {
  const insets = useSafeAreaInsets(); const { width } = useWindowDimensions()
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('home')
  const [products, setProducts] = useState<P[]>([]); const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<Record<number, number>>({}); const [wish, setWish] = useState<number[]>([])
  useEffect(() => {
    Promise.all([api('products'), api('cart'), api('wishlist')]).then(([p, c, w]) => {
      setProducts(p); setCart(Object.fromEntries(c.map((r: any) => [r.id, r.qty]))); setWish(w.map((r: any) => r.id))
    }).catch(console.warn).finally(() => setLoading(false))
  }, [])
  const setQty = (id: number, q: number) => { setCart((c) => { const n = { ...c }; if (q > 0) n[id] = q; else delete n[id]; return n }); api(`cart/${id}`, 'PUT', { qty: q }).catch(console.warn) }
  const toggleWish = (id: number) => { const on = wish.includes(id); setWish((w) => (on ? w.filter((x) => x !== id) : [...w, id])); api(`wishlist/${id}`, on ? 'DELETE' : 'POST').catch(console.warn) }
  const clear = () => { setCart({}); api('cart', 'DELETE').catch(console.warn) }
  const count = Object.values(cart).reduce((a, b) => a + b, 0)
  const badge = { home: 0, cart: count, wish: wish.length, me: 0 }
  const barW = width - 32, tabW = (barW - 16) / 4, idx = TABS.findIndex((t) => t[0] === tab)
  const px = useSharedValue(0)
  useEffect(() => { px.value = withSpring(idx * tabW, { damping: 18, stiffness: 220 }) }, [idx, tabW])
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: px.value }] }))
  const Page = { home: Home, cart: Cart, wish: Wishlist, me: Profile }[tab]
  return (
    <S.Provider value={{ products, loading, cart, wish, setQty, toggleWish, clear }}>
      <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
        <Animated.View key={tab} entering={FadeIn.duration(180)} style={{ flex: 1 }}><Page /></Animated.View>
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12), height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,.97)', padding: 8, flexDirection: 'row', ...shadow }}>
          <Animated.View style={[{ position: 'absolute', left: 8, top: 8, width: tabW, height: 48, borderRadius: 24, backgroundColor: '#000' }, pill]} />
          {TABS.map(([k, ic]) => (
            <Pressable key={k} onPress={() => setTab(k)} style={{ width: tabW, height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={(tab === k ? ic : `${ic}-outline`) as any} size={22} color={tab === k ? '#fff' : '#888'} />
              {badge[k] > 0 && <Animated.View key={badge[k]} entering={FadeIn} style={{ position: 'absolute', top: 4, right: tabW / 2 - 22, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{badge[k]}</Text></Animated.View>}
            </Pressable>))}
        </View>
      </View>
    </S.Provider>)
}
export default function App() {
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><StatusBar style="dark" /><Root /></SafeAreaProvider></GestureHandlerRootView>
}
