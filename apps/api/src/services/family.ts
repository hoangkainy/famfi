import { supabase } from '../lib/supabase';
import { Family, FamilyMember, MemberRole } from '../types';

interface CreateFamilyInput {
  name: string;
  userId: string;
}

interface JoinFamilyInput {
  inviteCode: string;
  userId: string;
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function createFamily(input: CreateFamilyInput): Promise<Family> {
  const { name, userId } = input;

  // Create family with invite code
  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({
      name,
      invite_code: generateInviteCode()
    })
    .select()
    .single();

  if (familyError || !family) {
    throw new Error(familyError?.message || 'Failed to create family');
  }

  // Add user as admin
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      user_id: userId,
      family_id: family.id,
      role: 'ADMIN' as MemberRole
    });

  if (memberError) {
    // Rollback: delete family
    await supabase.from('families').delete().eq('id', family.id);
    throw new Error(memberError.message);
  }

  return family as Family;
}

export async function joinFamily(input: JoinFamilyInput): Promise<Family> {
  const { inviteCode, userId } = input;

  // Find family by invite code
  const { data: family, error: findError } = await supabase
    .from('families')
    .select()
    .eq('invite_code', inviteCode.toUpperCase())
    .single();

  if (findError || !family) {
    throw new Error('Invalid invite code');
  }

  // Check if user already in family
  const { data: existing } = await supabase
    .from('family_members')
    .select()
    .eq('user_id', userId)
    .eq('family_id', family.id)
    .single();

  if (existing) {
    throw new Error('You are already a member of this family');
  }

  // Add user as viewer
  const { error: joinError } = await supabase
    .from('family_members')
    .insert({
      user_id: userId,
      family_id: family.id,
      role: 'VIEWER' as MemberRole
    });

  if (joinError) {
    throw new Error(joinError.message);
  }

  return family as Family;
}

export async function getUserFamily(userId: string): Promise<Family | null> {
  const { data: membership, error } = await supabase
    .from('family_members')
    .select('family_id, families(*)')
    .eq('user_id', userId)
    .single();

  if (error || !membership) {
    return null;
  }

  return membership.families as unknown as Family;
}

export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select(`
      id,
      user_id,
      family_id,
      role,
      joined_at,
      users:user_id (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('family_id', familyId);

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as FamilyMember[];
}

export async function refreshInviteCode(familyId: string, userId: string): Promise<string> {
  // Check if user is admin
  const { data: membership } = await supabase
    .from('family_members')
    .select('role')
    .eq('user_id', userId)
    .eq('family_id', familyId)
    .single();

  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Only admins can refresh invite code');
  }

  const newCode = generateInviteCode();

  const { error } = await supabase
    .from('families')
    .update({ invite_code: newCode })
    .eq('id', familyId);

  if (error) {
    throw new Error(error.message);
  }

  return newCode;
}
