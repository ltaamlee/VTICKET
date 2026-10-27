import { apiRequest } from "../../../services/api";

export function getCategories ({page = 1, keyword = ""} = {}){ 
    const params = new URLSearchParams({
		page: String(page),
		keyword,
	});

	return apiRequest(`/admin/categories?${params.toString()}`, {
		method: "GET",
	})
}

export function getCategoryById(id){
    return apiRequest(`/admin/categories/${id}`, {
        method: "GET",
    })
}

export function createCategory(data) {
    return apiRequest("/admin/categories", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateCategory(id, data){
    return apiRequest(`/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    })
}

export function deleteCategory(id){
    return apiRequest(`/admin/categories/${id}`, {
        method: "DELETE",
    })
}