import { ref } from 'vue';
import db from '../db/index';
import { ElMessage } from 'element-plus';

export function useCategories(externalCategories = null) {
  const categories = externalCategories || ref([]);

  const loadCategories = async () => {
    try {
      categories.value = await db.categories.toArray();
    } catch (error) {
      ElMessage.error('加载分类失败');
      console.error(error);
    }
  };

  const addCategory = async (title) => {
    if (!title || !title.trim()) {
      ElMessage.warning('分类名称不能为空');
      return null;
    }
    try {
      const id = await db.categories.add({
        title: title.trim()
      });
      await loadCategories();
      ElMessage.success('分类添加成功');
      return id;
    } catch (error) {
      ElMessage.error('添加分类失败');
      console.error(error);
      return null;
    }
  };

  const updateCategory = async (id, title) => {
    if (!title || !title.trim()) {
      ElMessage.warning('分类名称不能为空');
      return false;
    }
    try {
      await db.categories.update(id, { title: title.trim() });
      await loadCategories();
      ElMessage.success('分类更新成功');
      return true;
    } catch (error) {
      ElMessage.error('更新分类失败');
      console.error(error);
      return false;
    }
  };

  const deleteCategory = async (id) => {
    try {
      const noteCount = await db.notes.where('categoryId').equals(id).count();
      if (noteCount > 0) {
        ElMessage.warning(`该分类下有 ${noteCount} 条笔记，请先删除笔记`);
        return false;
      }
      await db.categories.delete(id);
      await loadCategories();
      ElMessage.success('分类删除成功');
      return true;
    } catch (error) {
      ElMessage.error('删除分类失败');
      console.error(error);
      return false;
    }
  };

  const getCategory = async (id) => {
    try {
      return await db.categories.get(id);
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  return {
    categories,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategory
  };
}
