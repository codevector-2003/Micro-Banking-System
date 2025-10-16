import { buildApiUrl, getAuthHeaders } from '../config/api';

export interface SavingsPlan {
    s_plan_id: string;
    plan_name: string;
    interest_rate: string;
    min_balance: number;
}

export class SavingsPlansService {
    static async getAllSavingsPlans(token: string): Promise<SavingsPlan[]> {
        const response = await fetch(buildApiUrl('/saving-accounts/plans'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            // Return proper database plan IDs as fallback
            return [
                { s_plan_id: 'CH001', plan_name: 'Children', interest_rate: '12', min_balance: 0 },
                { s_plan_id: 'TE001', plan_name: 'Teen', interest_rate: '11', min_balance: 500 },
                { s_plan_id: 'AD001', plan_name: 'Adult', interest_rate: '10', min_balance: 1000 },
                { s_plan_id: 'SE001', plan_name: 'Senior', interest_rate: '13', min_balance: 1000 },
                { s_plan_id: 'JO001', plan_name: 'Joint', interest_rate: '7', min_balance: 5000 }
            ];
        }

        return response.json();
    }
}