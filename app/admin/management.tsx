import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../services/AuthContext';
import {
  getCities,
  getKendras,
  getUsers,
  createCity,
  updateCity,
  deleteCity,
  createKendra,
  updateKendra,
  deleteKendra,
  createUser,
  updateUser,
  deleteUser,
} from '../../services/databaseService';
import { City, Kendra, User } from '../../types';
import { Colors, borderRadius } from '../../constants/Colors';
import { validateCityData, validateKendraData, validateUserData } from '../../utils/validation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Dropdown from '../../components/Dropdown';

type Tab = 'users' | 'cities' | 'kendras';

export default function AdminManagementScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [cities, setCities] = useState<City[]>([]);
  const [kendras, setKendras] = useState<Kendra[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<City | Kendra | User | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const [citiesData, kendrasData, usersData] = await Promise.all([
        getCities(),
        getKendras(),
        getUsers(),
      ]);
      setCities(citiesData);
      setKendras(kendrasData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadData(true);
  }, []);

  const handleDelete = async (type: Tab, id: string, name: string) => {
    Alert.alert(
      'Delete',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'cities') {
                await deleteCity(id);
              } else if (type === 'kendras') {
                await deleteKendra(id);
              } else {
                await deleteUser(id);
              }
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const filteredData = () => {
    const query = searchQuery.toLowerCase();
    if (activeTab === 'cities') {
      return cities.filter((c) => c.city_name.toLowerCase().includes(query));
    } else if (activeTab === 'kendras') {
      return kendras.filter((k) => k.kendra_name.toLowerCase().includes(query));
    } else {
      return users.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const filteredItems = filteredData();
  const getTabCount = () => {
    if (activeTab === 'users') return users.length;
    if (activeTab === 'cities') return cities.length;
    return kendras.length;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => {
            setActiveTab('users');
            setSearchQuery('');
          }}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={20}
            color={activeTab === 'users' ? Colors.primary : Colors.mutedForeground}
          />
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Users
          </Text>
          {users.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{users.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cities' && styles.tabActive]}
          onPress={() => {
            setActiveTab('cities');
            setSearchQuery('');
          }}
        >
          <MaterialCommunityIcons
            name="city"
            size={20}
            color={activeTab === 'cities' ? Colors.primary : Colors.mutedForeground}
          />
          <Text style={[styles.tabText, activeTab === 'cities' && styles.tabTextActive]}>
            Cities
          </Text>
          {cities.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{cities.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'kendras' && styles.tabActive]}
          onPress={() => {
            setActiveTab('kendras');
            setSearchQuery('');
          }}
        >
          <MaterialCommunityIcons
            name="office-building"
            size={20}
            color={activeTab === 'kendras' ? Colors.primary : Colors.mutedForeground}
          />
          <Text style={[styles.tabText, activeTab === 'kendras' && styles.tabTextActive]}>
            Kendras
          </Text>
          {kendras.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{kendras.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={Colors.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          placeholderTextColor={Colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color={Colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name={
                activeTab === 'users'
                  ? 'account-off'
                  : activeTab === 'cities'
                  ? 'city-variant-outline'
                  : 'office-building-outline'
              }
              size={64}
              color={Colors.mutedForeground}
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No results found' : `No ${activeTab} yet`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `Try adjusting your search query`
                : `Get started by adding your first ${activeTab.slice(0, -1)}`}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => {
                  setEditingItem(null);
                  setShowForm(true);
                }}
              >
                <MaterialCommunityIcons name="plus" size={20} color={Colors.primaryForeground} />
                <Text style={styles.emptyAddButtonText}>Add {activeTab.slice(0, -1)}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {activeTab === 'cities' && (
              <View>
                {filteredItems.map((city: City) => (
                  <View key={city.id} style={styles.itemCard}>
                    <View style={styles.itemIconContainer}>
                      <MaterialCommunityIcons name="city" size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{city.city_name}</Text>
                      <View style={styles.itemMeta}>
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={14}
                          color={Colors.mutedForeground}
                        />
                        <Text style={styles.itemSubtext}>PIN: {city.pin_code}</Text>
                      </View>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          setEditingItem(city);
                          setShowForm(true);
                        }}
                      >
                        <MaterialCommunityIcons name="pencil" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete('cities', city.id, city.city_name)}
                      >
                        <MaterialCommunityIcons name="delete" size={18} color={Colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'kendras' && (
              <View>
                {filteredItems.map((kendra: Kendra) => (
                  <View key={kendra.id} style={styles.itemCard}>
                    <View style={styles.itemIconContainer}>
                      <MaterialCommunityIcons
                        name="office-building"
                        size={24}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{kendra.kendra_name}</Text>
                      <View style={styles.itemMeta}>
                        <MaterialCommunityIcons
                          name="city"
                          size={14}
                          color={Colors.mutedForeground}
                        />
                        <Text style={styles.itemSubtext}>{kendra.city?.city_name}</Text>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>{kendra.kendra_type}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          setEditingItem(kendra);
                          setShowForm(true);
                        }}
                      >
                        <MaterialCommunityIcons name="pencil" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete('kendras', kendra.id, kendra.kendra_name)}
                      >
                        <MaterialCommunityIcons name="delete" size={18} color={Colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'users' && (
              <View>
                {filteredItems.map((userItem: User) => (
                  <View key={userItem.id} style={styles.itemCard}>
                    <View style={styles.itemIconContainer}>
                      <MaterialCommunityIcons
                        name={userItem.role === 'admin' ? 'account-cog' : 'account'}
                        size={24}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{userItem.name}</Text>
                      <View style={styles.itemMeta}>
                        <MaterialCommunityIcons
                          name="email"
                          size={14}
                          color={Colors.mutedForeground}
                        />
                        <Text style={styles.itemSubtext}>{userItem.email}</Text>
                      </View>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>
                          {userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          setEditingItem(userItem);
                          setShowForm(true);
                        }}
                      >
                        <MaterialCommunityIcons name="pencil" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete('users', userItem.id, userItem.name)}
                      >
                        <MaterialCommunityIcons name="delete" size={18} color={Colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEditingItem(null);
                setShowForm(true);
              }}
            >
              <MaterialCommunityIcons name="plus" size={24} color={Colors.primaryForeground} />
              <Text style={styles.addButtonText}>Add {activeTab.slice(0, -1)}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {showForm && (
        <ManagementForm
          type={activeTab}
          item={editingItem}
          cities={cities}
          kendras={kendras}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingItem(null);
            loadData();
          }}
        />
      )}
    </SafeAreaView>
  );
}

function ManagementForm({
  type,
  item,
  cities,
  kendras,
  onClose,
  onSave,
}: {
  type: Tab;
  item: City | Kendra | User | null;
  cities: City[];
  kendras: Kendra[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        city_name: '',
        name: '',
        email: '',
        password: '',
        role: 'member',
        pin_code: '',
        city_id: '',
        kendra_name: '',
        kendra_type: 'Yuvan',
        kendra_id: '',
      });
    }
  }, [item]);

  const handleSave = async () => {
    try {
      setSaving(true);

      if (type === 'cities') {
        const validation = validateCityData(formData);
        if (!validation.valid) {
          Alert.alert('Validation Error', validation.message);
          return;
        }
        if (item) {
          await updateCity(item.id, formData);
        } else {
          await createCity(formData);
        }
      } else if (type === 'kendras') {
        const validation = validateKendraData(formData);
        if (!validation.valid) {
          Alert.alert('Validation Error', validation.message);
          return;
        }
        if (item) {
          await updateKendra(item.id, formData);
        } else {
          await createKendra(formData);
        }
      } else {
        const validation = validateUserData({ ...formData, isEdit: !!item });
        if (!validation.valid) {
          Alert.alert('Validation Error', validation.message);
          return;
        }
        if (item) {
          await updateUser(item.id, formData);
        } else {
          await createUser(formData);
        }
      }

      onSave();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.formOverlay}>
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>
            {item ? `Edit ${type.slice(0, -1)}` : `Create ${type.slice(0, -1)}`}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContent}>
          {type === 'cities' && (
            <>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>City Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.city_name}
                  onChangeText={(text) => setFormData({ ...formData, city_name: text })}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>PIN Code *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.pin_code}
                  onChangeText={(text) => setFormData({ ...formData, pin_code: text })}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </>
          )}

          {type === 'kendras' && (
            <>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Kendra Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.kendra_name}
                  onChangeText={(text) => setFormData({ ...formData, kendra_name: text })}
                />
              </View>
              <Dropdown
                label="City *"
                options={cities.map((city) => ({
                  label: `${city.city_name} (${city.pin_code})`,
                  value: city.id,
                }))}
                value={formData.city_id}
                onValueChange={(value) => setFormData({ ...formData, city_id: value })}
                placeholder="Select a city"
              />
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Type *</Text>
                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={[
                      styles.pickerOption,
                      formData.kendra_type === 'Yuvan' && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, kendra_type: 'Yuvan' })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.kendra_type === 'Yuvan' && styles.pickerOptionTextSelected,
                      ]}
                    >
                      Yuvan
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.pickerOption,
                      formData.kendra_type === 'Yuvti' && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, kendra_type: 'Yuvti' })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.kendra_type === 'Yuvti' && styles.pickerOptionTextSelected,
                      ]}
                    >
                      Yuvti
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {type === 'users' && (
            <>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Email *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {!item && (
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Password *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    secureTextEntry
                  />
                </View>
              )}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Role *</Text>
                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={[
                      styles.pickerOption,
                      formData.role === 'admin' && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, role: 'admin', kendra_id: '' })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.role === 'admin' && styles.pickerOptionTextSelected,
                      ]}
                    >
                      Admin
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.pickerOption,
                      formData.role === 'member' && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, role: 'member' })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.role === 'member' && styles.pickerOptionTextSelected,
                      ]}
                    >
                      Member
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {formData.role === 'member' && (
                <Dropdown
                  label="Kendra *"
                  options={kendras.map((kendra) => ({
                    label: `${kendra.kendra_name} (${kendra.kendra_type})`,
                    value: kendra.id,
                  }))}
                  value={formData.kendra_id}
                  onValueChange={(value) => setFormData({ ...formData, kendra_id: value })}
                  placeholder="Select a kendra"
                />
              )}
            </>
          )}

          <TouchableOpacity
            style={[styles.saveFormButton, saving && styles.saveFormButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.primaryForeground} />
            ) : (
              <Text style={styles.saveFormButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    position: 'relative',
    gap: 4,
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.muted,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.foreground,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.foreground,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: borderRadius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  itemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 6,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  itemSubtext: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  typeBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accentForeground,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryForeground,
    textTransform: 'capitalize',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: Colors.destructive + '15',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: borderRadius,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  addButtonText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: borderRadius,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  emptyAddButtonText: {
    color: Colors.primaryForeground,
    fontSize: 15,
    fontWeight: '600',
  },
  formOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  formContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
    letterSpacing: -0.3,
  },
  formContent: {
    padding: 16,
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: borderRadius,
    padding: 12,
    fontSize: 15,
    color: Colors.foreground,
    minHeight: 48,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerOption: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
  },
  pickerOptionTextSelected: {
    color: Colors.primaryForeground,
  },
  saveFormButton: {
    backgroundColor: Colors.primary,
    borderRadius: borderRadius,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  saveFormButtonDisabled: {
    opacity: 0.6,
  },
  saveFormButtonText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
});

