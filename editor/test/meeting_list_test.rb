# frozen_string_literal: true

require 'minitest/autorun'
require 'tmpdir'
require_relative '../lib/recording_editor'

class MeetingListTest < Minitest::Test
  def setup
    @dir = Dir.mktmpdir('bbb-list-')
    @now = Time.utc(2026, 10, 10, 12)
    @id = "#{'a' * 40}-#{(@now.to_f * 1000).to_i - 60_000}"
    @repo = RecordingEditor::Repository.new(raw_root: File.join(@dir, 'recording', 'raw'),
      state_root: File.join(@dir, 'editor'), published_root: File.join(@dir, 'published', 'presentation'),
      unpublished_root: File.join(@dir, 'unpublished', 'presentation'))
  end

  def teardown
    FileUtils.remove_entry(@dir)
  end

  def raw(marks = '', id = @id)
    path = File.join(@repo.raw_root, id, 'events.xml')
    FileUtils.mkdir_p(File.dirname(path))
    File.write(path, "<recording><metadata meetingName='Raw meeting'/><event timestamp='1000' eventname='ParticipantJoinEvent'/>#{marks}<event timestamp='11000' eventname='EndAndKickAllEvent'/></recording>")
  end

  def marks
    "<event timestamp='2000' eventname='RecordStatusEvent'><status>true</status></event>" \
      "<event timestamp='4000' eventname='RecordStatusEvent'><status>false</status></event>" \
      "<event timestamp='7000' eventname='RecordStatusEvent'><status>true</status></event>"
  end

  def metadata(root, state, published, id = @id)
    path = File.join(root, id, 'metadata.xml')
    FileUtils.mkdir_p(File.dirname(path))
    File.write(path, "<recording><state>#{state}</state><published>#{published}</published><start_time>100000</start_time><end_time>110000</end_time><meta><meetingName>Metadata meeting</meetingName></meta><playback><duration>3000</duration></playback></recording>")
    path
  end

  def item
    @repo.list(now: @now).find { |entry| entry[:id] == @id }
  end

  def test_recorded_duration_counts_only_marks_and_preserves_open_ended_range
    raw(marks)
    assert_equal 'marked', item[:recording_status]
    assert_equal 6000, item[:recorded_duration_ms]
    assert_equal 10_000, item[:duration_ms]
    assert_equal 'not_generated', item[:publication_status]
    assert item[:raw_available]
  end

  def test_no_marks_are_not_a_recording_but_editor_can_still_offer_full_meeting
    raw
    assert_equal 'unmarked', item[:recording_status]
    assert_equal 0, item[:recorded_duration_ms]
    assert_equal [{ 'start_ms' => 0, 'end_ms' => 10_000 }], @repo.recording(@id).record_ranges
    raw("<event timestamp='4000' eventname='RecordStatusEvent'><status>false</status></event>")
    assert_equal 'unmarked', item[:recording_status]
    assert_equal 0, item[:recorded_duration_ms]
  end

  def test_unpublish_move_is_detected_without_raw_and_uses_metadata_name
    path = metadata(@repo.published_root, 'published', 'true')
    assert_equal 'published', item[:publication_status]
    assert_equal 'Metadata meeting', item[:name]
    assert_equal 10_000, item[:duration_ms]
    assert_equal 3000, item[:playback_duration_ms]
    refute item[:raw_available]
    assert_equal 'unknown', item[:recording_status]
    assert_nil item[:recorded_duration_ms]
    FileUtils.remove_entry(File.dirname(path))
    metadata(@repo.unpublished_root, 'unpublished', 'false')
    assert_equal 'unpublished', item[:publication_status]
  end

  def test_saved_intervals_update_list_without_changing_publication_status
    raw(marks)
    metadata(@repo.unpublished_root, 'unpublished', 'false')
    rec = @repo.recording(@id)
    RecordingEditor::Editor.new(@repo).save(@id, {
      'revision' => rec.revision, 'record_ranges' => [{ 'start_ms' => 500, 'end_ms' => 9500 }], 'beep_ranges' => []
    })
    assert_equal 9000, item[:recorded_duration_ms]
    assert_equal 'unpublished', item[:publication_status]
  end

  def test_processing_metadata_and_failed_jobs_are_not_mistaken_for_ready_recordings
    path = metadata(@repo.process_root, 'processing', 'false')
    assert_equal 'processing', item[:publication_status]
    metadata(@repo.process_root, 'processed', 'false')
    assert_equal 'processing', item[:publication_status]
    failure = File.join(@repo.status_root, 'published', "#{@id}-presentation.fail")
    FileUtils.mkdir_p(File.dirname(failure))
    File.write(failure, '')
    assert_equal 'unknown', item[:publication_status]
    assert item[:warnings].any? { |warning| warning.include?('失敗') }
    FileUtils.remove_entry(File.dirname(path))
    raw
    assert_equal 'unknown', item[:publication_status]
    assert item[:raw_available]
  end

  def test_missing_invalid_or_conflicting_metadata_does_not_hide_readable_raw
    raw(marks)
    FileUtils.mkdir_p(File.join(@repo.published_root, @id))
    assert_equal 'unknown', item[:publication_status]
    assert item[:raw_available]
    path = metadata(@repo.published_root, 'published', 'false')
    assert_equal 'unknown', item[:publication_status]
    File.write(path, '<!DOCTYPE recording [<!ENTITY x SYSTEM "file:///etc/passwd">]><recording>&x;</recording>')
    assert_equal 'unknown', item[:publication_status]
    assert item[:warnings].any? { |warning| warning.include?('DTD') }
    metadata(@repo.published_root, 'published', 'true')
    metadata(@repo.unpublished_root, 'unpublished', 'false')
    assert_equal 'unknown', item[:publication_status]
    assert item[:warnings].any? { |warning| warning.include?('両方') }
  end

  def test_unreadable_raw_keeps_known_publication_state
    raw
    File.write(File.join(@repo.raw_root, @id, 'events.xml'), 'invalid XML')
    metadata(@repo.unpublished_root, 'unpublished', 'false')
    assert_equal 'unpublished', item[:publication_status]
    assert_equal 'unknown', item[:recording_status]
    refute item[:raw_available]
    assert item[:warnings].any? { |warning| warning.include?('rawデータを読み込めません') }
  end

  def test_list_remains_limited_to_last_fourteen_days_and_sorted_by_meeting_id
    raw
    old = "#{'b' * 40}-#{((@now - 15 * 86_400).to_f * 1000).to_i}"
    future = "#{'c' * 40}-#{((@now + 60).to_f * 1000).to_i}"
    newer = "#{'d' * 40}-#{(@now.to_f * 1000).to_i - 10_000}"
    metadata(@repo.unpublished_root, 'unpublished', 'false', old)
    metadata(@repo.process_root, 'processing', 'false', future)
    metadata(@repo.published_root, 'published', 'true', newer)
    assert_equal [newer, @id], @repo.list(now: @now).map { |entry| entry[:id] }
  end
end
