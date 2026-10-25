import { apiRequest } from "../../../services/api";


export function getUserStats(){
    return apiRequest("/admin/user-stats", {
        method: "GET",
    });
}

export function getUsers({page = 1, keyword = "", role = ""} = {}){ 
    const params = new URLSearchParams({
		page: String(page),
		keyword,
		role,
	});

	return apiRequest(`/admin/users?${params.toString()}`, {
		method: "GET",
	})
}

export function getUserById(id){
    return apiRequest(`/admin/users/${id}`, {
        method: "GET",
    });
}

export function updateUser(id, data){
    return apiRequest(`/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function deleteUser(id){
    return apiRequest(`/admin/users/${id}`, {
        method: "DELETE",
    })
}