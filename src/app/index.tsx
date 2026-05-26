import { Image } from 'expo-image';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type Widget = {
  label: string;
  value: string;
  accent: string;
};

type Track = {
  rank: string;
  title: string;
  artist: string;
  plays: number;
  trend: 'up' | 'down' | 'same';
  image: string;
};

type Artist = {
  name: string;
  plays: string;
  initials: string;
  accent: string;
  spark: number[];
};

type Insight = {
  title: string;
  body: string;
  value: string;
  accent: string;
};

const widgets: Widget[] = [
  { label: 'Listening streak', value: '18 days', accent: '#f97316' },
  { label: 'Unique tracks', value: '1,284', accent: '#1db954' },
  { label: 'Total hours', value: '342h', accent: '#8b5cf6' },
  { label: 'Artists heard', value: '487', accent: '#3b82f6' },
  { label: 'Night listening', value: '39%', accent: '#6366f1' },
  { label: 'Total plays', value: '5,902', accent: '#f472b6' },
];

const recentTracks: Track[] = [
  {
    rank: '01',
    title: 'Midnight City',
    artist: 'M83',
    plays: 42,
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
  },
  {
    rank: '02',
    title: 'Sweet Disposition',
    artist: 'The Temper Trap',
    plays: 35,
    trend: 'same',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop',
  },
  {
    rank: '03',
    title: 'Nights',
    artist: 'Frank Ocean',
    plays: 31,
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200&h=200&fit=crop',
  },
  {
    rank: '04',
    title: 'Motion Sickness',
    artist: 'Phoebe Bridgers',
    plays: 28,
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=200&h=200&fit=crop',
  },
  {
    rank: '05',
    title: 'Eventually',
    artist: 'Tame Impala',
    plays: 26,
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop',
  },
];

const artists: Artist[] = [
  { name: 'SZA', plays: '312 plays', initials: 'SZ', accent: '#1db954', spark: [30, 46, 38, 76, 64] },
  { name: 'The Weeknd', plays: '288 plays', initials: 'TW', accent: '#8b5cf6', spark: [56, 62, 48, 70, 86] },
  { name: 'Rema', plays: '244 plays', initials: 'RE', accent: '#f97316', spark: [22, 38, 68, 74, 82] },
  { name: 'Billie Eilish', plays: '219 plays', initials: 'BE', accent: '#3b82f6', spark: [60, 36, 50, 42, 66] },
  { name: 'Asake', plays: '205 plays', initials: 'AS', accent: '#f472b6', spark: [28, 44, 52, 88, 72] },
];

const insights: Insight[] = [
  {
    title: 'Hidden Gem',
    body: 'One of your least-played recent discoveries is worth a closer listen.',
    value: 'Silver Lining - Raveena',
    accent: '#1db954',
  },
  {
    title: 'Artist Drift',
    body: 'Your most-played artist shifted this month.',
    value: 'Rema > SZA',
    accent: '#8b5cf6',
  },
  {
    title: 'Emotional Profile',
    body: 'Your recent listening leans towards high energy.',
    value: '42% energy',
    accent: '#f472b6',
  },
  {
    title: 'Favorite Decade',
    body: 'You are heavily anchored in the 2010s sound.',
    value: '2010s - 61%',
    accent: '#6366f1',
  },
];

const timeline = Array.from({ length: 42 }, (_, index) => ({
  id: `cell-${index}`,
  opacity: [0.12, 0.22, 0.34, 0.5, 0.72, 0.9][index % 6],
}));

const streamBars = [38, 54, 48, 72, 62, 88, 76, 96, 68, 74, 58, 82];
const moodBars = [68, 46, 78, 56, 84, 62, 72, 42];
const releaseYears = [
  { label: '08', height: 38 },
  { label: '12', height: 64 },
  { label: '16', height: 82 },
  { label: '20', height: 58 },
  { label: '24', height: 76 },
];

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TopNav />
        <HeroSection />
        <WidgetStrip />
        <RecentlyPlayed />
        <TopTracks />
        <TopArtists />
        <InsightsSection />
        <TimelineExplorer />
        <VisualAnalytics />
        <Rediscovery />
        <StoryModePreview />
      </ScrollView>
    </SafeAreaView>
  );
}

function TopNav() {
  return (
    <View style={styles.topNav}>
      <View>
        <Text style={styles.brand}>Echo Stats</Text>
        <Text style={styles.mutedText}>Dashboard</Text>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>CJ</Text>
      </View>
    </View>
  );
}

function HeroSection() {
  return (
    <View style={styles.hero}>
      <View style={styles.heroCopy}>
        <Text style={styles.kicker}>Good evening</Text>
        <Text style={styles.title}>Your music changed this month.</Text>
        <Text style={styles.subtitle}>
          A native dashboard for top tracks, artist drift, listening patterns, and story-ready
          insights.
        </Text>
      </View>

      <View style={styles.nowPlaying}>
        <Image source={recentTracks[0].image} style={styles.nowPlayingImage} contentFit="cover" />
        <View style={styles.flexOne}>
          <Text style={styles.pillLabel}>Now playing</Text>
          <Text style={styles.nowPlayingTitle} numberOfLines={1}>
            Midnight City - M83
          </Text>
        </View>
        <Equalizer />
      </View>

      <View style={styles.heroGrid}>
        <DashboardCard style={styles.heroCardLarge}>
          <Text style={styles.cardLabel}>Music Age</Text>
          <View style={styles.numberRow}>
            <Text style={styles.heroNumber}>2016</Text>
            <Text style={styles.numberSuffix}>years old</Text>
          </View>
          <MiniBars values={[32, 52, 48, 68, 56, 82, 76, 92]} color="#3b82f6" />
          <Text style={styles.cardHint}>Inferred from your release-date metadata.</Text>
        </DashboardCard>

        <DashboardCard style={styles.heroCard}>
          <Text style={styles.cardLabel}>Song of the Day</Text>
          <View style={styles.songRow}>
            <Image source={recentTracks[2].image} style={styles.songImage} contentFit="cover" />
            <View style={styles.flexOne}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                Nights
              </Text>
              <Text style={styles.cardHint}>Frank Ocean</Text>
              <Text style={[styles.cardHint, styles.pinkText]}>2 hours ago</Text>
            </View>
          </View>
        </DashboardCard>

        <DashboardCard style={styles.heroCard}>
          <Text style={styles.cardLabel}>Personality</Text>
          <Text style={styles.personality}>High Energy</Text>
          <Text style={styles.cardHint}>Calm 18% - Neutral 24% - Energy 42% - Late 16%.</Text>
          <MiniBars values={[18, 24, 42, 16]} color="#8b5cf6" labels={['Calm', 'Neutral', 'Energy', 'Late']} />
        </DashboardCard>
      </View>
    </View>
  );
}

function WidgetStrip() {
  return (
    <Section title="Stats">
      <View style={styles.widgetGrid}>
        {widgets.map((widget) => (
          <DashboardCard key={widget.label} style={styles.widgetCard}>
            <View style={[styles.iconDot, { backgroundColor: widget.accent }]} />
            <Text style={styles.widgetLabel} numberOfLines={1}>
              {widget.label}
            </Text>
            <Text style={styles.widgetValue}>{widget.value}</Text>
          </DashboardCard>
        ))}
      </View>
    </Section>
  );
}

function RecentlyPlayed() {
  return (
    <Section title="Recently played">
      <View style={styles.listCard}>
        {recentTracks.slice(0, 4).map((track) => (
          <TrackListItem key={`recent-${track.rank}`} track={track} compact />
        ))}
      </View>
    </Section>
  );
}

function TopTracks() {
  return (
    <Section title="Top Tracks" action="View All">
      <View style={styles.trackList}>
        {recentTracks.map((track) => (
          <TrackListItem key={track.rank} track={track} />
        ))}
      </View>
    </Section>
  );
}

function TrackListItem({ track, compact = false }: { track: Track; compact?: boolean }) {
  const trendColor = track.trend === 'up' ? '#1db954' : track.trend === 'down' ? '#f87171' : '#8f98a3';
  const trendLabel = track.trend === 'up' ? 'Up' : track.trend === 'down' ? 'Down' : 'Same';

  return (
    <View style={[styles.trackRow, compact && styles.compactTrackRow]}>
      {!compact && <Text style={styles.rank}>{track.rank}</Text>}
      <Image source={track.image} style={styles.albumImage} contentFit="cover" />
      <View style={styles.flexOne}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
      {!compact && (
        <View style={styles.trackMeta}>
          <Text style={[styles.trendText, { color: trendColor }]}>{trendLabel}</Text>
          <Text style={styles.plays}>{track.plays}</Text>
        </View>
      )}
    </View>
  );
}

function TopArtists() {
  return (
    <Section title="Top Artists">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artistRail}>
        {artists.map((artist, index) => (
          <DashboardCard key={artist.name} style={styles.artistCard}>
            <View style={[styles.artistAvatar, { backgroundColor: artist.accent }]}>
              <Text style={styles.artistInitials}>{artist.initials}</Text>
            </View>
            <Text style={styles.artistName} numberOfLines={1}>
              {artist.name}
            </Text>
            <Text style={styles.cardHint}>{artist.plays}</Text>
            <MiniBars values={artist.spark} color={artist.accent} compact />
            {index === 0 && <Text style={styles.topArtistBadge}>Top artist</Text>}
          </DashboardCard>
        ))}
      </ScrollView>
    </Section>
  );
}

function InsightsSection() {
  return (
    <Section title="Discovery Insights">
      <View style={styles.insightGrid}>
        {insights.map((insight) => (
          <DashboardCard key={insight.title} style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: insight.accent }]} />
            <Text style={styles.cardTitle}>{insight.title}</Text>
            <Text style={styles.cardHint}>{insight.body}</Text>
            <View style={styles.insightValueBox}>
              <Text style={[styles.insightValue, { color: insight.accent }]} numberOfLines={1}>
                {insight.value}
              </Text>
            </View>
          </DashboardCard>
        ))}
      </View>
    </Section>
  );
}

function TimelineExplorer() {
  return (
    <Section title="Timeline Explorer" subtitle="Explore moments in your listening history.">
      <DashboardCard style={styles.timelineCard}>
        <View style={styles.timelineHeader}>
          {['2021', '2022', '2023', '2024', '2025'].map((year) => (
            <Text key={year} style={styles.timelineYear}>
              {year}
            </Text>
          ))}
        </View>
        <View style={styles.rangeTrack}>
          <View style={styles.rangeSelection}>
            <Text style={styles.rangeText}>March - 31 days</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>Listening Density</Text>
        <View style={styles.heatmapRow}>
          <View style={styles.weekLabels}>
            <Text style={styles.tinyText}>Mon</Text>
            <Text style={styles.tinyText}>Wed</Text>
            <Text style={styles.tinyText}>Fri</Text>
          </View>
          <View style={styles.heatmap}>
            {timeline.map((cell) => (
              <View key={cell.id} style={[styles.heatCell, { opacity: cell.opacity }]} />
            ))}
          </View>
        </View>

        <View style={styles.snapshot}>
          <Text style={styles.cardTitle}>Snapshot: March</Text>
          <Text style={styles.cardHint}>1. Nights</Text>
          <Text style={styles.cardHint}>2. Sweet Disposition</Text>
          <Text style={styles.cardHint}>3. Eventually</Text>
          <Text style={[styles.insightValue, styles.greenText]}>Top Artist: SZA</Text>
        </View>
      </DashboardCard>
    </Section>
  );
}

function VisualAnalytics() {
  return (
    <Section title="Visual Analytics">
      <DashboardCard style={styles.analyticsLarge}>
        <Text style={styles.cardTitle}>Stream Timeline</Text>
        <MiniBars values={streamBars} color="#1db954" tall />
      </DashboardCard>

      <View style={styles.analyticsGrid}>
        <DashboardCard style={styles.analyticsCard}>
          <Text style={styles.cardTitle}>Artist Mix</Text>
          <View style={styles.donut}>
            <Text style={styles.donutValue}>487</Text>
            <Text style={styles.tinyText}>Artists</Text>
          </View>
        </DashboardCard>
        <DashboardCard style={styles.analyticsCard}>
          <Text style={styles.cardTitle}>Mood Spectrum</Text>
          <MiniBars values={moodBars} color="#f472b6" />
          <View style={styles.legendRow}>
            <Text style={styles.tinyText}>Late</Text>
            <Text style={styles.tinyText}>Energy</Text>
            <Text style={styles.tinyText}>Calm</Text>
          </View>
        </DashboardCard>
        <DashboardCard style={styles.analyticsCard}>
          <Text style={styles.cardTitle}>Release Year</Text>
          <View style={styles.yearBars}>
            {releaseYears.map((year) => (
              <View key={year.label} style={styles.yearItem}>
                <View style={[styles.yearBar, { height: year.height }]} />
                <Text style={styles.tinyText}>{year.label}</Text>
              </View>
            ))}
          </View>
        </DashboardCard>
      </View>
    </Section>
  );
}

function Rediscovery() {
  const cards = [
    { count: '64', title: 'Forgotten favorites', desc: 'Tracks you loved last year.', color: '#1db954' },
    { count: '21', title: 'Deep cuts', desc: 'Songs with only one play.', color: '#8b5cf6' },
    { count: '14', title: 'Old loops', desc: 'Repeat-heavy throwbacks.', color: '#f97316' },
    { count: '9', title: 'Comebacks', desc: 'Artists returning to rotation.', color: '#3b82f6' },
  ];

  return (
    <Section title="Rediscover" subtitle="Songs your past self loved.">
      <View style={styles.rediscoveryGrid}>
        {cards.map((card) => (
          <DashboardCard key={card.title} style={styles.rediscoveryCard}>
            <View style={styles.stackIcon}>
              <View style={[styles.stackBack, { backgroundColor: card.color }]} />
              <View style={[styles.stackFront, { backgroundColor: card.color }]} />
            </View>
            <Text style={styles.rediscoveryCount}>{card.count}</Text>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardHint}>{card.desc}</Text>
          </DashboardCard>
        ))}
      </View>
    </Section>
  );
}

function StoryModePreview() {
  return (
    <Section title="Story Mode">
      <DashboardCard style={styles.storyCard}>
        <View style={styles.storyCopy}>
          <Text style={styles.kicker}>Generated for you</Text>
          <Text style={styles.storyTitle}>Your Year So Far, ready to share.</Text>
          <Text style={styles.subtitle}>
            The dashboard is packaged into a visual story format optimized for Instagram and
            TikTok.
          </Text>
          <View style={styles.storyBullets}>
            <Text style={styles.bullet}>12 personalized slides</Text>
            <Text style={styles.bullet}>Optimized for social sharing</Text>
            <Text style={styles.bullet}>Animated transitions and music</Text>
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Open Story Mode</Text>
          </View>
        </View>
        <View style={styles.phone}>
          <View style={styles.phoneContent}>
            <View style={styles.slideIndicators}>
              {[0, 1, 2, 3].map((item) => (
                <View key={item} style={[styles.slideIndicator, item > 0 && styles.slideIndicatorDim]} />
              ))}
            </View>
            <Text style={styles.phoneKicker}>Discovery</Text>
            <Text style={styles.phoneTitle}>You found</Text>
            <Text style={styles.phoneNumber}>128</Text>
            <Text style={styles.phoneTitle}>new artists.</Text>
            <MiniBars values={[40, 70, 45, 90, 60, 85, 100, 50]} color="#ffffff" />
          </View>
        </View>
      </DashboardCard>
    </Section>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.flexOne}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
        {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function DashboardCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function MiniBars({
  values,
  color,
  labels,
  compact = false,
  tall = false,
}: {
  values: number[];
  color: string;
  labels?: string[];
  compact?: boolean;
  tall?: boolean;
}) {
  return (
    <View>
      <View style={[styles.bars, compact && styles.compactBars, tall && styles.tallBars]}>
        {values.map((value, index) => (
          <View key={`${value}-${index}`} style={styles.barSlot}>
            <View style={[styles.bar, { height: `${value}%`, backgroundColor: color }]} />
          </View>
        ))}
      </View>
      {labels ? (
        <View style={styles.barLabels}>
          {labels.map((label) => (
            <Text key={label} style={styles.tinyText}>
              {label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Equalizer() {
  return (
    <View style={styles.equalizer}>
      {[45, 80, 35, 100, 62].map((height, index) => (
        <View key={index} style={[styles.equalizerBar, { height: `${height}%` }]} />
      ))}
    </View>
  );
}

const colors = {
  background: '#070a0d',
  card: '#121820',
  cardAlt: '#17202a',
  border: '#253141',
  text: '#f8fafc',
  muted: '#91a0ad',
  faint: '#5f6b78',
  green: '#1db954',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    gap: 28,
    padding: 18,
    paddingBottom: 42,
  },
  topNav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  brand: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  mutedText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarText: {
    color: '#061108',
    fontSize: 13,
    fontWeight: '900',
  },
  hero: {
    gap: 18,
  },
  heroCopy: {
    gap: 8,
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 39,
    fontWeight: '900',
    lineHeight: 43,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  nowPlaying: {
    alignItems: 'center',
    backgroundColor: '#10161d',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  nowPlayingImage: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  flexOne: {
    flex: 1,
  },
  pillLabel: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  nowPlayingTitle: {
    color: '#dce5df',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  equalizer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 3,
    height: 24,
    width: 34,
  },
  equalizerBar: {
    backgroundColor: colors.green,
    borderRadius: 3,
    width: 3,
  },
  heroGrid: {
    gap: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  heroCardLarge: {
    gap: 14,
  },
  heroCard: {
    gap: 14,
  },
  cardLabel: {
    color: '#b8c2cc',
    fontSize: 13,
    fontWeight: '800',
  },
  numberRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  heroNumber: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 58,
  },
  numberSuffix: {
    color: colors.faint,
    fontSize: 13,
    marginBottom: 8,
  },
  cardHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  songRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  songImage: {
    borderRadius: 8,
    height: 74,
    width: 74,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  pinkText: {
    color: '#f472b6',
    fontWeight: '800',
  },
  personality: {
    color: '#c4b5fd',
    fontSize: 26,
    fontStyle: 'italic',
    fontWeight: '800',
  },
  bars: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 5,
    height: 56,
  },
  compactBars: {
    height: 30,
    marginTop: 12,
  },
  tallBars: {
    height: 150,
    marginTop: 18,
  },
  barSlot: {
    backgroundColor: '#222b36',
    borderRadius: 5,
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    minHeight: 4,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tinyText: {
    color: colors.faint,
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 3,
  },
  sectionAction: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    paddingBottom: 3,
  },
  widgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  widgetCard: {
    gap: 9,
    minHeight: 108,
    width: '48.5%',
  },
  iconDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  widgetLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  widgetValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  listCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  trackList: {
    gap: 7,
  },
  trackRow: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 74,
    padding: 11,
  },
  compactTrackRow: {
    borderRadius: 0,
    borderWidth: 0,
    minHeight: 64,
  },
  rank: {
    color: '#3d4754',
    fontSize: 20,
    fontWeight: '900',
    width: 34,
  },
  albumImage: {
    borderRadius: 8,
    height: 48,
    width: 48,
  },
  trackTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  trackArtist: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  trackMeta: {
    alignItems: 'flex-end',
    gap: 4,
    width: 48,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '800',
  },
  plays: {
    color: '#ccd4dc',
    fontSize: 13,
    fontWeight: '800',
  },
  artistRail: {
    gap: 12,
    paddingRight: 4,
  },
  artistCard: {
    alignItems: 'center',
    gap: 8,
    width: 154,
  },
  artistAvatar: {
    alignItems: 'center',
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  artistInitials: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  artistName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    maxWidth: '100%',
  },
  topArtistBadge: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '900',
  },
  insightGrid: {
    gap: 12,
  },
  insightCard: {
    gap: 10,
  },
  insightIcon: {
    borderRadius: 8,
    height: 28,
    opacity: 0.85,
    width: 28,
  },
  insightValueBox: {
    backgroundColor: '#0d1218',
    borderColor: '#202a36',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  insightValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  timelineCard: {
    gap: 18,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineYear: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: '800',
  },
  rangeTrack: {
    backgroundColor: '#17202a',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  rangeSelection: {
    alignItems: 'center',
    backgroundColor: 'rgba(29,185,84,0.22)',
    borderColor: colors.green,
    borderLeftWidth: 2,
    borderRadius: 6,
    borderRightWidth: 2,
    height: 28,
    justifyContent: 'center',
  },
  rangeText: {
    color: '#d7f6e1',
    fontSize: 11,
    fontWeight: '800',
  },
  heatmapRow: {
    flexDirection: 'row',
    gap: 10,
  },
  weekLabels: {
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  heatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    maxWidth: 236,
  },
  heatCell: {
    backgroundColor: colors.green,
    borderRadius: 3,
    height: 18,
    width: 18,
  },
  snapshot: {
    backgroundColor: '#0d1218',
    borderColor: '#202a36',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  greenText: {
    color: colors.green,
    marginTop: 6,
  },
  analyticsLarge: {
    gap: 10,
  },
  analyticsGrid: {
    gap: 12,
  },
  analyticsCard: {
    gap: 14,
    minHeight: 168,
  },
  donut: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: colors.green,
    borderRadius: 54,
    borderWidth: 14,
    height: 108,
    justifyContent: 'center',
    width: 108,
  },
  donutValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yearBars: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 12,
    height: 110,
    justifyContent: 'space-around',
  },
  yearItem: {
    alignItems: 'center',
    flex: 1,
    gap: 7,
    justifyContent: 'flex-end',
  },
  yearBar: {
    backgroundColor: '#8b5cf6',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 10,
    width: '100%',
  },
  rediscoveryGrid: {
    gap: 12,
  },
  rediscoveryCard: {
    gap: 8,
  },
  stackIcon: {
    height: 44,
    marginBottom: 4,
    position: 'relative',
    width: 56,
  },
  stackBack: {
    borderRadius: 8,
    height: 34,
    left: 16,
    opacity: 0.55,
    position: 'absolute',
    top: 8,
    transform: [{ rotate: '12deg' }],
    width: 34,
  },
  stackFront: {
    borderRadius: 8,
    height: 34,
    left: 2,
    position: 'absolute',
    top: 0,
    width: 34,
  },
  rediscoveryCount: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 48,
  },
  storyCard: {
    gap: 28,
  },
  storyCopy: {
    gap: 14,
  },
  storyTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  storyBullets: {
    gap: 9,
    marginTop: 2,
  },
  bullet: {
    color: '#d9e2ea',
    fontSize: 14,
    fontWeight: '700',
  },
  cta: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.green,
    borderRadius: 999,
    marginTop: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  ctaText: {
    color: '#061108',
    fontSize: 14,
    fontWeight: '900',
  },
  phone: {
    alignSelf: 'center',
    backgroundColor: '#05070a',
    borderColor: '#202631',
    borderRadius: 34,
    borderWidth: 6,
    height: 430,
    overflow: 'hidden',
    padding: 8,
    width: 220,
  },
  phoneContent: {
    backgroundColor: '#7c2d12',
    borderRadius: 24,
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  slideIndicators: {
    flexDirection: 'row',
    gap: 4,
    left: 18,
    position: 'absolute',
    right: 18,
    top: 18,
  },
  slideIndicator: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    flex: 1,
    height: 4,
  },
  slideIndicatorDim: {
    opacity: 0.32,
  },
  phoneKicker: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  phoneTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 33,
  },
  phoneNumber: {
    color: '#ffffff',
    fontSize: 58,
    fontWeight: '900',
    lineHeight: 66,
   },
});
