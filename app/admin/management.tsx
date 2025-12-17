import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
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
import { Colors } from '../../constants/Colors';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<City | Kendra | User | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
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
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cities' && styles.tabActive]}
          onPress={() => setActiveTab('cities')}
        >
          <Text style={[styles.tabText, activeTab === 'cities' && styles.tabTextActive]}>
            Cities
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'kendras' && styles.tabActive]}
          onPress={() => setActiveTab('kendras')}
        >
          <Text style={[styles.tabText, activeTab === 'kendras' && styles.tabTextActive]}>
            Kendras
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'cities' && (
          <View>
            {filteredData().map((city: City) => (
              <View key={city.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{city.city_name}</Text>
                  <Text style={styles.itemSubtext}>PIN: {city.pin_code}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingItem(city);
                      setShowForm(true);
                    }}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete('cities', city.id, city.city_name)}
                    style={styles.deleteButton}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'kendras' && (
          <View>
            {filteredData().map((kendra: Kendra) => (
              <View key={kendra.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{kendra.kendra_name}</Text>
                  <Text style={styles.itemSubtext}>
                    {kendra.city?.city_name} • {kendra.kendra_type}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingItem(kendra);
                      setShowForm(true);
                    }}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete('kendras', kendra.id, kendra.kendra_name)}
                    style={styles.deleteButton}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'users' && (
          <View>
            {filteredData().map((userItem: User) => (
              <View key={userItem.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{userItem.name}</Text>
                  <Text style={styles.itemSubtext}>{userItem.email}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{userItem.role}</Text>
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingItem(userItem);
                      setShowForm(true);
                    }}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete('users', userItem.id, userItem.name)}
                    style={styles.deleteButton}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color={Colors.error} />
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
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  itemSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 16,
  },
  deleteButton: {
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  addButtonText: {
    color: Colors.primaryForeground,
    fontSize: 16,
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
    fontWeight: '600',
    color: Colors.text,
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
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    minHeight: 48,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pickerOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  pickerOptionTextSelected: {
    color: '#fff',
  },
  saveFormButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
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

